import { ensureAdminTables, json, validateSession } from "../../../_shared/admin-auth.js";
import { cleanupProjectImages, cleanupReplacedProjectImages, ensureProjectCmsTable, getProjectById, listProjects, materializeProjectImages, upsertProject } from "../../../_shared/project-cms.js";

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
  try {
    const auth = await requireAdmin(context);
    if (auth.response) return auth.response;
    const body = await context.request.json();
    const project = body?.project;
    if (!project?.id || !project?.slug || !project?.status) return json({ ok: false, error: "프로젝트 데이터가 올바르지 않습니다." }, 400);
    const previous = await getProjectById(auth.db, project.id);
    const stored = await materializeProjectImages(context.env.PROJECT_MEDIA, project);
    await upsertProject(auth.db, stored);
    await cleanupReplacedProjectImages(context.env.PROJECT_MEDIA, previous, stored);
    return json({ ok: true, project: stored });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "프로젝트 저장에 실패했습니다." }, 500);
  }
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAdmin(context);
    if (auth.response) return auth.response;
    const body = await context.request.json();
    const projects = Array.isArray(body?.projects) ? body.projects : [];
    const storedProjects = [];
    const submittedIds = projects.map((project) => String(project?.id || "")).filter(Boolean);
    const existing = await listProjects(auth.db, false);
    const submittedSet = new Set(submittedIds);
    for (const removed of existing.filter((item) => !submittedSet.has(String(item.id)))) await cleanupProjectImages(context.env.PROJECT_MEDIA, removed);
    if (submittedIds.length) {
      const placeholders = submittedIds.map(() => "?").join(",");
      await auth.db.prepare(`DELETE FROM cms_projects WHERE id NOT IN (${placeholders})`).bind(...submittedIds).run();
    } else {
      await auth.db.prepare("DELETE FROM cms_projects").run();
    }
    for (const project of projects) {
      if (!project?.id || !project?.slug || !project?.status) continue;
      const previous = await getProjectById(auth.db, project.id);
      const stored = await materializeProjectImages(context.env.PROJECT_MEDIA, project);
      await upsertProject(auth.db, stored);
      await cleanupReplacedProjectImages(context.env.PROJECT_MEDIA, previous, stored);
      storedProjects.push(stored);
    }
    return json({ ok: true, projects: storedProjects });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "프로젝트 동기화에 실패했습니다." }, 500);
  }
}
