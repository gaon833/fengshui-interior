import { Suspense } from "react";
import ProjectClientDetail from "@/components/project/ProjectClientDetail";
import { getProjects } from "@/lib/projects";

export default function ProjectViewPage() {
  return (
    <Suspense fallback={<p className="project-empty">프로젝트를 불러오는 중입니다.</p>}>
      <ProjectClientDetail defaults={getProjects()} />
    </Suspense>
  );
}
