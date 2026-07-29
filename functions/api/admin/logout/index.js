import { clearSessionCookie, ensureAdminTables, json, removeSession } from "../../../_shared/admin-auth.js";
export async function onRequestPost(context) {
  if (context.env.DB) {
    await ensureAdminTables(context.env.DB);
    await removeSession(context.env.DB, context.request);
  }
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}
