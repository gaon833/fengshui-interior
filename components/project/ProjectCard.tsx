import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/project";

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="project-card">
      <Link href={`/project/${project.slug}`}>
        <div className="project-card-image">
          <Image
            src={project.coverImage}
            alt={project.title}
            width={1600}
            height={1100}
            loading={index < 2 ? "eager" : "lazy"}
            fetchPriority={index < 2 ? "high" : "auto"}
            quality={80}
            sizes="(max-width:900px) calc(100vw - 36px), 50vw"
          />
        </div>
        <div className="project-card-meta">
          <div><h2>{project.title}</h2><p>{project.useType} · {project.area}</p></div>
          <span className="project-card-year">{project.year}</span>
        </div>
      </Link>
    </article>
  );
}
