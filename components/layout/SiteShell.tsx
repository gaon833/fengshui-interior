"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/brand/BrandLogo";
import DesktopSidebar from "./DesktopSidebar";
import MenuDrawer from "./MenuDrawer";

export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isProjectIndex = pathname === "/project";
  const isHome = pathname === "/";

  return (
    <div className={`site-shell${isProjectIndex ? " site-shell--project-index" : ""}`}>
      {isProjectIndex && <DesktopSidebar />}
      {!isProjectIndex && <BrandLogo className="site-floating-logo" />}
      {!isProjectIndex && <MenuDrawer variant="site" useBackdrop={isHome} />}
      <main className="site-content">{children}</main>
    </div>
  );
}
