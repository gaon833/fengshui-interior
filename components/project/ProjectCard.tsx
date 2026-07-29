import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/project";

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const layout = project.cardLayout ?? "wide";

  return (
    <article className={`project-card project-card--${layout}`}>
      <Link href={`/project/view/?slug=${encodeURIComponent(project.slug)}`} aria-label={`${project.title} 프로젝트 보기`}>
        <div className="project-card-image">
          <picture>
            {project.mobileCoverImage && (
              <source media="(max-width: 900px)" srcSet={project.mobileCoverImage} />
            )}
            <Image
              src={project.coverImage}
              alt={`${project.title} 인테리어 대표 이미지`}
              width={layout === "portrait" ? 1100 : 1600}
              height={layout === "portrait" ? 1500 : layout === "square" ? 1200 : 1050}
              loading={index < 2 ? "eager" : "lazy"}
              fetchPriority={index < 2 ? "high" : "auto"}
              quality={82}
              unoptimized={project.coverImage.startsWith("data:")}
              sizes="(max-width:900px) calc(100vw - 36px), (max-width:1600px) calc((100vw - 480px) / 2), calc((100vw - 720px) / 2)"
            />
          </picture>
        </div>
        <div className="project-card-meta">
          <div>
            <h2>{project.title}</h2>
            <p>{project.location} · {project.area}</p>
          </div>
          <span className="project-card-year">{project.year}</span>
        </div>
      </Link>
    </article>
  );
}
