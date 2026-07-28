import type { Project } from "@/types/project";
import ProjectCard from "./ProjectCard";

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const leftProjects = projects.filter((_, index) => index % 2 === 0);
  const rightProjects = projects.filter((_, index) => index % 2 === 1);

  return (
    <section className="project-grid">
      <div className="project-grid-column">
        {leftProjects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index * 2} />
        ))}
      </div>
      <div className="project-grid-column">
        {rightProjects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index * 2 + 1} />
        ))}
      </div>
    </section>
  );
}
