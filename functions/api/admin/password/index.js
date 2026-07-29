import { clearSessionCookie, ensureAdminTables, json, replacePin, validateSession, verifyPin } from "../../../_shared/admin-auth.js";
export async function onRequestPost(context) {
  try {
    if (!context.env.DB) return json({ ok: false, message: "D1 바인딩 DB가 없습니다." }, 503);
    await ensureAdminTables(context.env.DB);
    if (!(await validateSession(context.env.DB, context.request))) return json({ ok: false, message: "로그인이 만료되었습니다." }, 401);
    const body = await context.request.json();
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    if (!/^\d{4}$/.test(newPassword)) return json({ ok: false, message: "새 비밀번호는 숫자 4자리로 입력하세요." }, 400);
    if (!(await verifyPin(context.env.DB, currentPassword))) return json({ ok: false, message: "현재 비밀번호가 맞지 않습니다." }, 401);
    await replacePin(context.env.DB, newPassword);
    return json({ ok: true, message: "비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인하세요." }, 200, { "set-cookie": clearSessionCookie() });
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다." }, 500);
  }
}
