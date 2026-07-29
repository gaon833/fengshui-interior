"use client";

import { useEffect, useRef, useState } from "react";
import { ADMIN_TOAST_EVENT, type AdminToastType } from "@/lib/admin-toast";

type ToastState = { message: string; type: AdminToastType; visible: boolean };

export default function AdminToast() {
  const [toast, setToast] = useState<ToastState>({ message: "", type: "success", visible: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; type?: AdminToastType }>).detail;
      if (!detail?.message) return;
      if (timer.current) clearTimeout(timer.current);
      setToast({ message: detail.message, type: detail.type || "success", visible: true });
      timer.current = setTimeout(() => setToast((current) => ({ ...current, visible: false })), 2600);
    };
    window.addEventListener(ADMIN_TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(ADMIN_TOAST_EVENT, onToast);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!toast.visible) return null;
  return <div className={`admin-toast admin-toast-${toast.type}`} role="status" aria-live="polite">{toast.message}</div>;
}
