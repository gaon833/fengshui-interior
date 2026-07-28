import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/project";

export default function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const layout = project.cardLayout ?? (index % 2 === 0 ? "wide" : "portrait");

  return (
    <article className={`project-card is-${layout}`}>
      <Link href={`/project/${project.slug}`}>
        <div className="project-card-image">
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </div>
        <div className="project-card-meta">
          <h2>{project.title}</h2>
          <p>{project.useType} · {project.area}</p>
          <span className="project-card-year">{project.year}</span>
        </div>
      </Link>
    </article>
  );
}
