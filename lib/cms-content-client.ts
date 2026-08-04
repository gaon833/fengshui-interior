"use client";

export async function fetchCmsContent<T>(key: string, fallback: T, admin = false): Promise<T> {
  try {
    const response = await fetch(`${admin ? "/api/admin/content" : "/api/content"}?key=${encodeURIComponent(key)}`, {
      credentials: admin ? "include" : "same-origin", cache: "no-store",
    });
    const data = await response.json().catch(() => null) as { ok?: boolean; value?: T | null } | null;
    return response.ok && data?.ok && data.value != null ? data.value : fallback;
  } catch { return fallback; }
}

export async function saveCmsContent<T>(key: string, value: T): Promise<T> {
  const response = await fetch("/api/admin/content", {
    method: "POST", headers: { "content-type": "application/json" }, credentials: "include",
    body: JSON.stringify({ key, value }),
  });
  const data = await response.json().catch(() => null) as { ok?: boolean; value?: T; error?: string } | null;
  if (!response.ok || !data?.ok || data.value == null) throw new Error(data?.error || "서버 저장에 실패했습니다.");
  return data.value;
}
