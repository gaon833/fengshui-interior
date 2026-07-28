"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/brand/BrandLogo";
import DesktopSidebar from "./DesktopSidebar";
import MenuDrawer from "./MenuDrawer";
export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const hasFixedSidebar = !isHome;
  return (
    <div className={`site-shell${hasFixedSidebar ? " site-shell--fixed" : ""}`}>
      {hasFixedSidebar && <DesktopSidebar />}
      <BrandLogo className="site-floating-logo" />
      <MenuDrawer variant="site" useBackdrop={isHome} />
      <main className="site-content">{children}</main>
    </div>
  );
}
