import { ensureAdminTables, json, validateSession } from "../../../_shared/admin-auth.js";
export async function onRequestGet(context) {
  if (!context.env.DB) return json({ ok: false, authenticated: false }, 503);
  await ensureAdminTables(context.env.DB);
  const session = await validateSession(context.env.DB, context.request);
  return json({ ok: true, authenticated: Boolean(session), expiresAt: session?.expiresAt ? session.expiresAt * 1000 : undefined });
}
