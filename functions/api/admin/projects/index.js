import { ensureAdminTables, json, validateSession } from "../../../_shared/admin-auth.js";
import { cleanupNewProjectImages, cleanupProjectImages, cleanupReplacedProjectImages, ensureProjectCmsTable, getProjectById, listProjects, materializeProjectImages, upsertProject } from "../../../_shared/project-cms.js";

async function requireAdmin(context) {
  if (!context.env.DB) return { response: json({ ok: false, error: "D1 바인딩 DB가 없습니다." }, 503) };
  await ensureAdminTables(context.env.DB);
  const session = await validateSession(context.env.DB, context.request);
  if (!session) return { response: json({ ok: false, error: "Unauthorized" }, 401) };
  await ensureProjectCmsTable(context.env.DB);
  return { db: context.env.DB };
}

export async function onRequestGet(context) {
  try {
    const auth = await requireAdmin(context);
    if (auth.response) return auth.response;
    return json({ ok: true, projects: await listProjects(auth.db, false) });
  } catch (error) {
    return json({ ok: false, projects: [], error: error instanceof Error ? error.message : "프로젝트를 불러오지 못했습니다." }, 500);
  }
}

export async function onRequestPost(context) {
  let project = null;
  let stored = null;
  try {
    const auth = await requireAdmin(context);
    if (auth.response) return auth.response;
    const body = await context.request.json();
    project = body?.project;
    if (!project?.id || !project?.slug || !project?.status) return json({ ok: false, error: "프로젝트 데이터가 올바르지 않습니다." }, 400);
    const previous = await getProjectById(auth.db, project.id);
    stored = await materializeProjectImages(context.env.PROJECT_MEDIA, project);
    try {
      await upsertProject(auth.db, stored);
    } catch (error) {
      await cleanupNewProjectImages(context.env.PROJECT_MEDIA, project, stored).catch(() => undefined);
      throw error;
    }
    await cleanupReplacedProjectImages(context.env.PROJECT_MEDIA, previous, stored);
    return json({ ok: true, project: stored });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "프로젝트 저장에 실패했습니다." }, 500);
  }
}

export async function onRequestPut(context) {
  const materialized = [];
  try {
    const auth = await requireAdmin(context);
    if (auth.response) return auth.response;
    const body = await context.request.json();
    const projects = Array.isArray(body?.projects) ? body.projects : [];
    const validProjects = projects.filter((project) => project?.id && project?.slug && project?.status);
    const existing = await listProjects(auth.db, false);
    const existingMap = new Map(existing.map((item) => [String(item.id), item]));

    // 1) 새 이미지를 먼저 모두 안전하게 R2에 준비한다. 기존 데이터/이미지는 아직 건드리지 않는다.
    for (const project of validProjects) {
      const stored = await materializeProjectImages(context.env.PROJECT_MEDIA, project);
      materialized.push({ original: project, stored, previous: existingMap.get(String(project.id)) || null });
    }

    // 2) D1 변경을 한 번의 batch로 처리한다. 중간 실패 시 D1은 기존 상태를 유지한다.
    const ids = validProjects.map((project) => String(project.id));
    const now = Date.now();
    const statements = materialized.map(({ stored }) => auth.db.prepare(`INSERT INTO cms_projects (id, slug, status, data, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, status = excluded.status, data = excluded.data, updated_at = excluded.updated_at`)
      .bind(String(stored.id), String(stored.slug), String(stored.status), JSON.stringify(stored), now));
    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      statements.push(auth.db.prepare(`DELETE FROM cms_projects WHERE id NOT IN (${placeholders})`).bind(...ids));
    } else {
      statements.push(auth.db.prepare("DELETE FROM cms_projects"));
    }
    try {
      await auth.db.batch(statements);
    } catch (error) {
      // D1 저장 실패 시 이번 요청에서 새로 만든 R2 파일만 되돌린다.
      for (const item of materialized) await cleanupNewProjectImages(context.env.PROJECT_MEDIA, item.original, item.stored).catch(() => undefined);
      throw error;
    }

    // 3) DB가 성공한 뒤에만 더 이상 참조되지 않는 옛 R2 파일을 삭제한다.
    const submittedSet = new Set(ids);
    for (const removed of existing.filter((item) => !submittedSet.has(String(item.id)))) {
      await cleanupProjectImages(context.env.PROJECT_MEDIA, removed).catch(() => undefined);
    }
    for (const item of materialized) {
      await cleanupReplacedProjectImages(context.env.PROJECT_MEDIA, item.previous, item.stored).catch(() => undefined);
    }

    return json({ ok: true, projects: materialized.map((item) => item.stored) });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "프로젝트 동기화에 실패했습니다." }, 500);
  }
}


export async function onRequestDelete(context) {
  try {
    const auth = await requireAdmin(context);
    if (auth.response) return auth.response;

    const url = new URL(context.request.url);
    const id = String(url.searchParams.get("id") || "").trim();
    if (!id) return json({ ok: false, error: "삭제할 프로젝트 ID가 없습니다." }, 400);

    // 삭제 전에 D1의 원본 데이터를 읽어 R2 이미지 키를 확보한다.
    const existing = await getProjectById(auth.db, id);
    if (!existing) return json({ ok: true, deleted: false, id });

    // D1에서 영구 삭제를 먼저 확정한다.
    await auth.db.prepare("DELETE FROM cms_projects WHERE id = ?").bind(id).run();

    // D1 삭제 성공 후 해당 프로젝트가 참조하던 R2 이미지를 정리한다.
    // R2 정리 실패 때문에 이미 확정된 D1 삭제를 되돌리지는 않는다.
    let r2CleanupOk = true;
    let r2CleanupError = "";
    try {
      await cleanupProjectImages(context.env.PROJECT_MEDIA, existing);
    } catch (error) {
      r2CleanupOk = false;
      r2CleanupError = error instanceof Error ? error.message : "R2 이미지 정리에 실패했습니다.";
      console.error("[projects permanent delete] R2 cleanup failed", { id, error: r2CleanupError });
    }

    return json({
      ok: true,
      deleted: true,
      id,
      r2CleanupOk,
      r2CleanupError,
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "프로젝트 영구 삭제에 실패했습니다." }, 500);
  }
}
