import { json } from "../../_shared/admin-auth.js";
import { ensureProjectCmsTable, listProjects } from "../../_shared/project-cms.js";

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) return json({ ok: false, projects: [], hiddenIds: [], error: "D1 바인딩 DB가 없습니다." }, 503);
    await ensureProjectCmsTable(context.env.DB);
    const all = await listProjects(context.env.DB, false);
    const projects = all.filter((project) => project.status === "published");
    const hiddenIds = all.filter((project) => project.status !== "published").map((project) => project.id);
    return json({ ok: true, projects, hiddenIds });
  } catch (error) {
    return json({ ok: false, projects: [], hiddenIds: [], error: error instanceof Error ? error.message : "프로젝트를 불러오지 못했습니다." }, 500);
  }
}
