import ProjectFilterView from "@/components/project/ProjectFilterView";
import { getProjects } from "@/lib/projects";

export default function ProjectPage() {
  return (
    <div className="project-index">
      <ProjectFilterView projects={getProjects()} />
    </div>
  );
}
