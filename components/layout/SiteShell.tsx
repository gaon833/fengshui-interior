"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/brand/BrandLogo";
import DesktopSidebar from "./DesktopSidebar";
import MenuDrawer from "./MenuDrawer";

export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const hasFixedSidebar = !isHome;
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    const updateHeader = () => setHeaderHidden(window.scrollY > 72);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, [pathname]);

  return (
    <div className={`site-shell${hasFixedSidebar ? " site-shell--fixed" : ""}${headerHidden ? " site-shell--header-hidden" : ""}`}>
      {hasFixedSidebar && <DesktopSidebar />}
      <BrandLogo className="site-floating-logo scroll-aware-header" />
      <div className="scroll-aware-header"><MenuDrawer variant="site" useBackdrop={isHome} /></div>
      <main className="site-content">{children}</main>
    </div>
  );
}
