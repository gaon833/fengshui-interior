import { checkLock, clearFailures, clientKey, createSession, ensureAdminTables, json, recordFailure, sessionCookie, verifyPin } from "../../../_shared/admin-auth.js";

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) return json({ ok: false, message: "D1 바인딩 DB가 없습니다." }, 503);
    await ensureAdminTables(context.env.DB);
    const body = await context.request.json();
    const password = typeof body?.password === "string" ? body.password : "";
    if (!/^\d{4}$/.test(password)) return json({ ok: false, message: "비밀번호는 숫자 4자리로 입력하세요." }, 400);
    const key = clientKey(context.request);
    const lock = await checkLock(context.env.DB, key);
    if (lock.locked) return json({ ok: false, lockedUntil: lock.lockedUntil * 1000, message: "로그인이 잠겨 있습니다. 잠시 후 다시 시도하세요." }, 429);
    if (!(await verifyPin(context.env.DB, password))) {
      const failed = await recordFailure(context.env.DB, key, lock.count);
      if (failed.lockedUntil) return json({ ok: false, lockedUntil: failed.lockedUntil * 1000, message: "비밀번호를 5회 잘못 입력해 5분 동안 잠겼습니다." }, 429);
      return json({ ok: false, remainingAttempts: failed.remainingAttempts, message: `비밀번호가 올바르지 않습니다. ${failed.remainingAttempts}회 남았습니다.` }, 401);
    }
    await clearFailures(context.env.DB, key);
    const session = await createSession(context.env.DB);
    return json({ ok: true, authenticated: true }, 200, { "set-cookie": sessionCookie(session.token, session.seconds) });
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : "로그인에 실패했습니다." }, 500);
  }
}
