import type { ReactNode } from "react";
import SiteShell from "@/components/layout/SiteShell";
import PublicContentProtection from "@/components/site/PublicContentProtection";
import StructuredData from "@/components/site/StructuredData";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StructuredData />
      <PublicContentProtection>
        <SiteShell>{children}</SiteShell>
      </PublicContentProtection>
    </>
  );
}
