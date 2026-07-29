import type { ReactNode } from "react";
import AdminNav from "./AdminNav";
import AdminAuthGate from "./AdminAuthGate";
import AdminToast from "./AdminToast";

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGate>
      <section className="admin-page">
        <AdminNav />
        <div className="admin-content">{children}</div>
        <AdminToast />
      </section>
    </AdminAuthGate>
  );
}
