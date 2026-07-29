interface Env {
  ADMIN_AUTH: KVNamespace;
}

type PasswordRecord = { salt: string; hash: string };
type FailureRecord = { count: number; lockedUntil: number };

const PASSWORD_KEY = "admin:password";
const SESSION_PREFIX = "admin:session:";
const FAILURE_PREFIX = "admin:failure:";
const DEFAULT_PASSWORD = "1234";
const MAX_FAILURES = 5;
const LOCK_MS = 5 * 60 * 1000;
const SHORT_SESSION_SECONDS = 12 * 60 * 60;
const LONG_SESSION_SECONDS = 7 * 24 * 60 * 60;

const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function randomHex(length = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return bytesToHex(bytes);
}

async function deriveHash(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120000 },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

async function makePasswordRecord(password: string): Promise<PasswordRecord> {
  const salt = randomHex(16);
  return { salt, hash: await deriveHash(password, salt) };
}

async function getPasswordRecord(env: Env): Promise<PasswordRecord> {
  const existing = await env.ADMIN_AUTH.get<PasswordRecord>(PASSWORD_KEY, "json");
  if (existing?.salt && existing?.hash) return existing;
  const initial = await makePasswordRecord(DEFAULT_PASSWORD);
  await env.ADMIN_AUTH.put(PASSWORD_KEY, JSON.stringify(initial));
  return initial;
}

async function verifyPassword(env: Env, password: string): Promise<boolean> {
  const record = await getPasswordRecord(env);
  return (await deriveHash(password, record.salt)) === record.hash;
}

function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie") || "";
  for (const item of cookie.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return null;
}

function clientKey(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function authenticated(request: Request, env: Env): Promise<boolean> {
  const token = getCookie(request, "fengshui_admin_session");
  return Boolean(token && (await env.ADMIN_AUTH.get(`${SESSION_PREFIX}${token}`)));
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  return json({ ok: true, authenticated: await authenticated(request, env) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { action?: string; password?: string; remember?: boolean; currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "잘못된 요청입니다." }, 400);
  }

  if (body.action === "logout") {
    const token = getCookie(request, "fengshui_admin_session");
    if (token) await env.ADMIN_AUTH.delete(`${SESSION_PREFIX}${token}`);
    return json({ ok: true }, 200, { "Set-Cookie": "fengshui_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0" });
  }

  if (body.action === "change-password") {
    if (!(await authenticated(request, env))) return json({ ok: false, message: "로그인이 만료되었습니다." }, 401);
    if (!body.currentPassword || !(await verifyPassword(env, body.currentPassword))) {
      return json({ ok: false, message: "현재 비밀번호가 맞지 않습니다." }, 400);
    }
    if (!body.newPassword || !/^\d{4}$/.test(body.newPassword)) {
      return json({ ok: false, message: "새 비밀번호는 숫자 4자리로 입력하세요." }, 400);
    }
    await env.ADMIN_AUTH.put(PASSWORD_KEY, JSON.stringify(await makePasswordRecord(body.newPassword)));
    return json({ ok: true, message: "비밀번호가 변경되었습니다. 이제 모든 기기에서 새 비밀번호가 적용됩니다." });
  }

  if (body.action !== "login" || typeof body.password !== "string") {
    return json({ ok: false, message: "잘못된 요청입니다." }, 400);
  }
  if (!/^\d{4}$/.test(body.password)) {
    return json({ ok: false, message: "비밀번호는 숫자 4자리로 입력하세요." }, 400);
  }

  const failureKey = `${FAILURE_PREFIX}${clientKey(request)}`;
  const now = Date.now();
  const failure = (await env.ADMIN_AUTH.get<FailureRecord>(failureKey, "json")) || { count: 0, lockedUntil: 0 };
  if (failure.lockedUntil > now) {
    const minutes = Math.max(1, Math.ceil((failure.lockedUntil - now) / 60000));
    return json({ ok: false, lockedUntil: failure.lockedUntil, message: `로그인이 잠겨 있습니다. 약 ${minutes}분 후 다시 시도하세요.` }, 429);
  }

  if (!(await verifyPassword(env, body.password))) {
    const count = failure.count + 1;
    if (count >= MAX_FAILURES) {
      const lockedUntil = now + LOCK_MS;
      await env.ADMIN_AUTH.put(failureKey, JSON.stringify({ count: 0, lockedUntil }), { expirationTtl: 600 });
      return json({ ok: false, lockedUntil, message: "비밀번호를 5회 틀려 5분 동안 로그인이 잠겼습니다." }, 429);
    }
    await env.ADMIN_AUTH.put(failureKey, JSON.stringify({ count, lockedUntil: 0 }), { expirationTtl: 600 });
    return json({ ok: false, remainingAttempts: MAX_FAILURES - count, message: `비밀번호가 맞지 않습니다. ${MAX_FAILURES - count}회 더 시도할 수 있습니다.` }, 401);
  }

  await env.ADMIN_AUTH.delete(failureKey);
  const token = randomHex(32);
  const maxAge = body.remember ? LONG_SESSION_SECONDS : SHORT_SESSION_SECONDS;
  await env.ADMIN_AUTH.put(`${SESSION_PREFIX}${token}`, "1", { expirationTtl: maxAge });
  return json(
    { ok: true, authenticated: true },
    200,
    { "Set-Cookie": `fengshui_admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}` },
  );
};
