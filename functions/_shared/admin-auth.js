const DEFAULT_PIN = "8333";
const COOKIE_NAME = "fengshui_admin_session";
const SHORT_SESSION_SECONDS = 12 * 60 * 60;
const LONG_SESSION_SECONDS = 12 * 60 * 60;
const LOCK_SECONDS = 5 * 60;
const MAX_FAILURES = 5;
const ITERATIONS = 120000;

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hashPin(pin, saltBase64) {
  const salt = saltBase64 ? base64ToBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, key, 256);
  return { salt: bytesToBase64(salt), hash: bytesToBase64(new Uint8Array(bits)) };
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function ensureAdminTables(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_credentials (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS admin_login_attempts (
      client_key TEXT PRIMARY KEY,
      failure_count INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);
  const existing = await db.prepare("SELECT id FROM admin_credentials WHERE id = 1").first();
  if (!existing) {
    const initial = await hashPin(DEFAULT_PIN);
    await db.prepare("INSERT INTO admin_credentials (id, password_hash, password_salt) VALUES (1, ?, ?)")
      .bind(initial.hash, initial.salt).run();
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

export function clientKey(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "unknown";
}

export function readCookie(request) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function sessionCookie(token, maxAge) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function verifyPin(db, pin) {
  const row = await db.prepare("SELECT password_hash, password_salt FROM admin_credentials WHERE id = 1").first();
  if (!row) return false;
  const computed = await hashPin(pin, row.password_salt);
  return constantTimeEqual(computed.hash, row.password_hash);
}

export async function replacePin(db, pin) {
  const next = await hashPin(pin);
  await db.prepare(`UPDATE admin_credentials SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`)
    .bind(next.hash, next.salt).run();
  await db.prepare("DELETE FROM admin_sessions").run();
}

export async function createSession(db, remember) {
  const token = randomToken();
  const seconds = SHORT_SESSION_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + seconds;
  await db.prepare("INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)").bind(token, expiresAt).run();
  return { token, seconds, expiresAt };
}

export async function validateSession(db, request) {
  const token = readCookie(request);
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare("SELECT token, expires_at FROM admin_sessions WHERE token = ? AND expires_at > ?").bind(token, now).first();
  if (!row) return null;
  return { token: row.token, expiresAt: Number(row.expires_at) };
}

export async function removeSession(db, request) {
  const token = readCookie(request);
  if (token) await db.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(token).run();
}

export async function checkLock(db, key) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare("SELECT failure_count, locked_until FROM admin_login_attempts WHERE client_key = ?").bind(key).first();
  if (!row) return { locked: false, count: 0, lockedUntil: 0 };
  if (Number(row.locked_until) > now) return { locked: true, count: Number(row.failure_count), lockedUntil: Number(row.locked_until) };
  if (Number(row.locked_until) > 0) await db.prepare("DELETE FROM admin_login_attempts WHERE client_key = ?").bind(key).run();
  return { locked: false, count: Number(row.failure_count || 0), lockedUntil: 0 };
}

export async function recordFailure(db, key, currentCount) {
  const next = currentCount + 1;
  const now = Math.floor(Date.now() / 1000);
  const lockedUntil = next >= MAX_FAILURES ? now + LOCK_SECONDS : 0;
  const storedCount = next >= MAX_FAILURES ? 0 : next;
  await db.prepare(`INSERT INTO admin_login_attempts (client_key, failure_count, locked_until, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(client_key) DO UPDATE SET failure_count = excluded.failure_count, locked_until = excluded.locked_until, updated_at = CURRENT_TIMESTAMP`)
    .bind(key, storedCount, lockedUntil).run();
  return { lockedUntil, remainingAttempts: lockedUntil ? 0 : MAX_FAILURES - next };
}

export async function clearFailures(db, key) {
  await db.prepare("DELETE FROM admin_login_attempts WHERE client_key = ?").bind(key).run();
}
