"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import MenuDrawer from "@/components/layout/MenuDrawer";

export default function ProjectDetailShell({ children }: { children: ReactNode }) {
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    const updateHeader = () => setHeaderHidden(window.scrollY > 72);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <div className={`project-detail-shell${headerHidden ? " project-detail-shell--header-hidden" : ""}`}>
      <BrandLogo className="project-detail-logo scroll-aware-header" />
      <div className="scroll-aware-header"><MenuDrawer variant="detail" useBackdrop={false} /></div>
      <main className="project-detail-content">{children}</main>
    </div>
  );
}
