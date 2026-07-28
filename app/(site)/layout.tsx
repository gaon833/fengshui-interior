import type { ReactNode } from "react";
import SiteShell from "@/components/layout/SiteShell";
import PublicContentProtection from "@/components/site/PublicContentProtection";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <PublicContentProtection>
      <SiteShell>{children}</SiteShell>
    </PublicContentProtection>
  );
}
