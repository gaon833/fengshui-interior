import type { ReactNode } from "react";
import AdminNav from "./AdminNav";

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <section className="admin-page">
      <AdminNav />
      <div className="admin-content">{children}</div>
    </section>
  );
}
