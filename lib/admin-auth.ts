export const ADMIN_AUTH_EVENT = "fengshui-admin-auth-changed";
export const MAX_FAILURES = 5;

const PASSWORD_KEY = "fengshui-admin-pin";
const PERSISTENT_SESSION_KEY = "fengshui-admin-session";
const TEMP_SESSION_KEY = "fengshui-admin-session-temp";
const FAILURE_KEY = "fengshui-admin-login-failures";
const DEFAULT_PASSWORD = "8333";
const LOCK_MS = 5 * 60 * 1000;
const SHORT_SESSION_MS = 12 * 60 * 60 * 1000;
const LONG_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

type SessionRecord = {
  expiresAt: number;
};

type FailureRecord = {
  count: number;
  lockedUntil: number;
};

export type AdminAuthResult = {
  ok: boolean;
  authenticated?: boolean;
  message?: string;
  remainingAttempts?: number;
  lockedUntil?: number;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getStoredPassword(): string {
  if (!isBrowser()) return DEFAULT_PASSWORD;
  const saved = window.localStorage.getItem(PASSWORD_KEY);
  if (/^\d{4}$/.test(saved || "")) return saved as string;
  window.localStorage.setItem(PASSWORD_KEY, DEFAULT_PASSWORD);
  return DEFAULT_PASSWORD;
}

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function validSession(storage: Storage, key: string): boolean {
  const session = readJson<SessionRecord>(storage, key);
  if (!session || session.expiresAt <= Date.now()) {
    storage.removeItem(key);
    return false;
  }
  return true;
}

function getFailureRecord(): FailureRecord {
  if (!isBrowser()) return { count: 0, lockedUntil: 0 };
  return readJson<FailureRecord>(window.localStorage, FAILURE_KEY) || { count: 0, lockedUntil: 0 };
}

function saveFailureRecord(record: FailureRecord): void {
  window.localStorage.setItem(FAILURE_KEY, JSON.stringify(record));
}

function clearFailures(): void {
  window.localStorage.removeItem(FAILURE_KEY);
}

function emitAuthChange(): void {
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}

export async function checkAdminSession(): Promise<boolean> {
  if (!isBrowser()) return false;
  return validSession(window.localStorage, PERSISTENT_SESSION_KEY) || validSession(window.sessionStorage, TEMP_SESSION_KEY);
}

export async function loginAdmin(password: string, remember: boolean): Promise<AdminAuthResult> {
  if (!isBrowser()) return { ok: false, message: "브라우저에서 다시 시도하세요." };
  if (!/^\d{4}$/.test(password)) return { ok: false, message: "비밀번호는 숫자 4자리로 입력하세요." };

  const now = Date.now();
  const failure = getFailureRecord();
  if (failure.lockedUntil > now) {
    const minutes = Math.max(1, Math.ceil((failure.lockedUntil - now) / 60000));
    return {
      ok: false,
      lockedUntil: failure.lockedUntil,
      message: `로그인이 잠겨 있습니다. 약 ${minutes}분 후 다시 시도하세요.`,
    };
  }

  if (password !== getStoredPassword()) {
    const nextCount = failure.count + 1;
    if (nextCount >= MAX_FAILURES) {
      const lockedUntil = now + LOCK_MS;
      saveFailureRecord({ count: 0, lockedUntil });
      return { ok: false, lockedUntil, message: "비밀번호를 5회 잘못 입력해 5분 동안 잠겼습니다." };
    }
    saveFailureRecord({ count: nextCount, lockedUntil: 0 });
    return {
      ok: false,
      remainingAttempts: MAX_FAILURES - nextCount,
      message: `비밀번호가 올바르지 않습니다. ${MAX_FAILURES - nextCount}회 남았습니다.`,
    };
  }

  clearFailures();
  window.localStorage.removeItem(PERSISTENT_SESSION_KEY);
  window.sessionStorage.removeItem(TEMP_SESSION_KEY);
  const record: SessionRecord = { expiresAt: now + (remember ? LONG_SESSION_MS : SHORT_SESSION_MS) };
  const storage = remember ? window.localStorage : window.sessionStorage;
  const key = remember ? PERSISTENT_SESSION_KEY : TEMP_SESSION_KEY;
  storage.setItem(key, JSON.stringify(record));
  emitAuthChange();
  return { ok: true, authenticated: true };
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<AdminAuthResult> {
  if (!isBrowser()) return { ok: false, message: "브라우저에서 다시 시도하세요." };
  if (!(await checkAdminSession())) return { ok: false, message: "로그인이 만료되었습니다." };
  if (currentPassword !== getStoredPassword()) return { ok: false, message: "현재 비밀번호가 맞지 않습니다." };
  if (!/^\d{4}$/.test(newPassword)) return { ok: false, message: "새 비밀번호는 숫자 4자리로 입력하세요." };

  window.localStorage.setItem(PASSWORD_KEY, newPassword);
  clearFailures();
  return { ok: true, message: "비밀번호가 변경되었습니다." };
}

export async function logoutAdmin(): Promise<void> {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PERSISTENT_SESSION_KEY);
  window.sessionStorage.removeItem(TEMP_SESSION_KEY);
  emitAuthChange();
}
