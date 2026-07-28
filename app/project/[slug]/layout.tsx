import type { ReactNode } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import MenuDrawer from "@/components/layout/MenuDrawer";

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="project-detail-shell">
      <BrandLogo className="project-detail-logo" />
      <MenuDrawer variant="detail" />
      <main className="project-detail-content">{children}</main>
    </div>
  );
}
