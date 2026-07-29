"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/brand/BrandLogo";
import DesktopSidebar from "./DesktopSidebar";
import MenuDrawer from "./MenuDrawer";

export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDeleteMode = searchParams.get("adminDelete") === "1";
  const isHome = pathname === "/";
  const hasFixedSidebar = !isHome && !isDeleteMode;
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    const updateHeader = () => setHeaderHidden(window.scrollY > 72);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, [pathname]);

  return (
    <div className={`site-shell${hasFixedSidebar ? " site-shell--fixed" : ""}${headerHidden ? " site-shell--header-hidden" : ""}${isDeleteMode ? " site-shell--delete-mode" : ""}`}>
      {hasFixedSidebar && <DesktopSidebar />}
      {!isDeleteMode && <BrandLogo className="site-floating-logo scroll-aware-header" />}
      {!isDeleteMode && <div className="scroll-aware-header"><MenuDrawer variant="site" useBackdrop={isHome} /></div>}
      <main className="site-content">{children}</main>
    </div>
  );
}
