export const ADMIN_TOAST_EVENT = "fengshui-admin-toast";

export type AdminToastType = "success" | "error" | "info";

export function showAdminToast(message: string, type: AdminToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_TOAST_EVENT, { detail: { message, type } }));
}
