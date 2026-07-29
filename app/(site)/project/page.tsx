import type { Metadata } from "next";

export const metadata: Metadata = { title: "PROJECTS", description: "평형별 주거 및 상업 공간 인테리어 프로젝트를 확인하세요." };

import ProjectStoreView from "@/components/project/ProjectStoreView";
import { getProjects } from "@/lib/projects";

export default function ProjectPage() {
  return (
    <div className="project-index">
      <ProjectStoreView projects={getProjects()} />
    </div>
  );
}
