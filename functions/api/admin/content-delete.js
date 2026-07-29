import { ensureAdminTables, json, validateSession } from "../../_shared/admin-auth.js";

export async function onRequestPost(context) {
  if (!context.env.DB) return json({ ok: false, error: "D1 binding is unavailable." }, 503);
  await ensureAdminTables(context.env.DB);
  const session = await validateSession(context.env.DB, context.request);
  if (!session) return json({ ok: false, error: "Unauthorized" }, 401);
  const body = await context.request.json().catch(() => ({}));
  const kind = String(body.kind || "");
  const id = String(body.id || "").slice(0, 240);
  if (!kind || !id) return json({ ok: false, error: "Missing target." }, 400);

  if (kind === "gallery") {
    await context.env.DB.batch([
      context.env.DB.prepare("DELETE FROM gallery_ai_analysis WHERE gallery_id = ?").bind(id),
      context.env.DB.prepare("DELETE FROM gallery_stats WHERE gallery_id = ?").bind(id),
      context.env.DB.prepare("DELETE FROM analytics_events WHERE gallery_id = ? OR image_id = ?").bind(id, id),
    ]);
  } else if (kind === "project") {
    await context.env.DB.batch([
      context.env.DB.prepare("DELETE FROM project_stats WHERE project_slug = ?").bind(id),
      context.env.DB.prepare("DELETE FROM analytics_events WHERE project_slug = ?").bind(id),
    ]);
  }
  return json({ ok: true });
}
