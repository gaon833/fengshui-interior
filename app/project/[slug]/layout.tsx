import type { ReactNode } from "react";
import ProjectDetailShell from "@/components/layout/ProjectDetailShell";

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return <ProjectDetailShell>{children}</ProjectDetailShell>;
}
