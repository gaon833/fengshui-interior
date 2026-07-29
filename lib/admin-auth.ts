export const ADMIN_AUTH_EVENT = "fengshui-admin-auth-changed";
export const MAX_FAILURES = 5;

type ApiResult = {
  ok: boolean;
  authenticated?: boolean;
  message?: string;
  remainingAttempts?: number;
  lockedUntil?: number;
};

async function request(method: string, body?: Record<string, unknown>): Promise<ApiResult> {
  try {
    const response = await fetch("/api/admin-auth", {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = (await response.json()) as ApiResult;
    return { ...data, ok: response.ok && data.ok !== false };
  } catch {
    return { ok: false, message: "인증 서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요." };
  }
}

export async function checkAdminSession(): Promise<boolean> {
  const result = await request("GET");
  return Boolean(result.ok && result.authenticated);
}

export async function loginAdmin(password: string, remember: boolean): Promise<ApiResult> {
  const result = await request("POST", { action: "login", password, remember });
  if (result.ok) window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
  return result;
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<ApiResult> {
  return request("POST", { action: "change-password", currentPassword, newPassword });
}

export async function logoutAdmin(): Promise<void> {
  await request("POST", { action: "logout" });
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}
