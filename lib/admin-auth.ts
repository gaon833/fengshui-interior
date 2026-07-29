export const ADMIN_PASSWORD_HASH_KEY = "fengshui_admin_password_hash_v1";
export const ADMIN_SESSION_KEY = "fengshui_admin_session_v1";
export const ADMIN_FAILURE_KEY = "fengshui_admin_failure_v1";
export const ADMIN_AUTH_EVENT = "fengshui-admin-auth-changed";
export const DEFAULT_ADMIN_PASSWORD = "fengshui2026";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const LOCK_DURATION_MS = 5 * 60 * 1000;
export const MAX_FAILURES = 5;

export type FailureState = { count: number; lockedUntil: number };

export async function hashPassword(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function ensurePasswordHash(): Promise<string> {
  const existing = localStorage.getItem(ADMIN_PASSWORD_HASH_KEY);
  if (existing) return existing;
  const initial = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  localStorage.setItem(ADMIN_PASSWORD_HASH_KEY, initial);
  return initial;
}

export function getFailureState(): FailureState {
  try {
    const raw = localStorage.getItem(ADMIN_FAILURE_KEY);
    if (!raw) return { count: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw) as FailureState;
    return { count: Number(parsed.count) || 0, lockedUntil: Number(parsed.lockedUntil) || 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

export function saveFailureState(state: FailureState) {
  localStorage.setItem(ADMIN_FAILURE_KEY, JSON.stringify(state));
}

export function clearFailures() {
  localStorage.removeItem(ADMIN_FAILURE_KEY);
}

export function createSession(remember: boolean) {
  const expiresAt = Date.now() + (remember ? SESSION_DURATION_MS : 12 * 60 * 60 * 1000);
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem(ADMIN_SESSION_KEY);
  target.setItem(ADMIN_SESSION_KEY, JSON.stringify({ expiresAt }));
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}

export function hasValidSession(): boolean {
  for (const storage of [sessionStorage, localStorage]) {
    try {
      const raw = storage.getItem(ADMIN_SESSION_KEY);
      if (!raw) continue;
      const { expiresAt } = JSON.parse(raw) as { expiresAt: number };
      if (expiresAt > Date.now()) return true;
      storage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      storage.removeItem(ADMIN_SESSION_KEY);
    }
  }
  return false;
}

export function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}
