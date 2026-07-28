import type { ReactNode } from "react";
import ProjectDetailShell from "@/components/layout/ProjectDetailShell";
import PublicContentProtection from "@/components/site/PublicContentProtection";

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return (
    <PublicContentProtection>
      <ProjectDetailShell>{children}</ProjectDetailShell>
    </PublicContentProtection>
  );
}
