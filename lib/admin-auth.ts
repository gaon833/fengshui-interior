export const ADMIN_AUTH_EVENT = "fengshui-admin-auth-changed";
export const MAX_FAILURES = 5;

export type AdminAuthResult = {
  ok: boolean;
  authenticated?: boolean;
  message?: string;
  remainingAttempts?: number;
  lockedUntil?: number;
};

function isBrowser(): boolean { return typeof window !== "undefined"; }
function emitAuthChange(): void { if (isBrowser()) window.dispatchEvent(new Event(ADMIN_AUTH_EVENT)); }

async function request<T extends AdminAuthResult>(url: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, { ...init, credentials: "same-origin", headers: { "content-type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
    const data = (await response.json()) as T;
    return data;
  } catch {
    return { ok: false, message: "인증 서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요." } as T;
  }
}

export async function checkAdminSession(): Promise<boolean> {
  if (!isBrowser()) return false;
  const result = await request<AdminAuthResult>("/api/admin/session", { method: "GET" });
  return Boolean(result.ok && result.authenticated);
}

export async function loginAdmin(password: string): Promise<AdminAuthResult> {
  if (!/^\d{4}$/.test(password)) return { ok: false, message: "비밀번호는 숫자 4자리로 입력하세요." };
  const result = await request<AdminAuthResult>("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
  if (result.ok) emitAuthChange();
  return result;
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<AdminAuthResult> {
  if (!/^\d{4}$/.test(newPassword)) return { ok: false, message: "새 비밀번호는 숫자 4자리로 입력하세요." };
  const result = await request<AdminAuthResult>("/api/admin/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
  if (result.ok) emitAuthChange();
  return result;
}

export async function logoutAdmin(): Promise<void> {
  if (!isBrowser()) return;
  await request<AdminAuthResult>("/api/admin/logout", { method: "POST", body: "{}" });
  emitAuthChange();
}
