"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import MenuDrawer from "@/components/layout/MenuDrawer";

export default function ProjectDetailShell({ children }: { children: ReactNode }) {
  const [headerHidden, setHeaderHidden] = useState(false);
  const previousScrollY = useRef(0);

  useEffect(() => {
    previousScrollY.current = window.scrollY;
    setHeaderHidden(false);

    const updateHeader = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 72) {
        setHeaderHidden(false);
      } else if (currentScrollY > previousScrollY.current + 4) {
        setHeaderHidden(true);
      } else if (currentScrollY < previousScrollY.current - 4) {
        setHeaderHidden(false);
      }

      previousScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <div className={`project-detail-shell${headerHidden ? " project-detail-shell--header-hidden" : ""}`}>
      <BrandLogo className="project-detail-logo scroll-aware-header" />
      <div className="scroll-aware-header">
        <MenuDrawer variant="detail" useBackdrop={false} />
      </div>
      <main className="project-detail-content">{children}</main>
    </div>
  );
}
