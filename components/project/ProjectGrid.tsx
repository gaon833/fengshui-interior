import type { Project } from "@/types/project";
import ProjectCard from "./ProjectCard";

export default function ProjectGrid({ projects, adminDeleteActive = false, onDeleteProject }: { projects: Project[]; adminDeleteActive?: boolean; onDeleteProject?: (project: Project) => void }) {
  const leftProjects = projects.filter((_, index) => index % 2 === 0);
  const rightProjects = projects.filter((_, index) => index % 2 === 1);

  return (
    <section className="project-grid-wrap" aria-live="polite">
      <div className="project-grid project-grid--desktop">
        <div className="project-grid-column">
          {leftProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index * 2} adminDeleteActive={adminDeleteActive} onDeleteProject={onDeleteProject} />
          ))}
        </div>
        <div className="project-grid-column">
          {rightProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index * 2 + 1} adminDeleteActive={adminDeleteActive} onDeleteProject={onDeleteProject} />
          ))}
        </div>
      </div>

      <div className="project-grid project-grid--mobile">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} adminDeleteActive={adminDeleteActive} onDeleteProject={onDeleteProject} />
        ))}
      </div>
    </section>
  );
}
