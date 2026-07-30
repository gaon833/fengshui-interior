"use client";

import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/project";
import ScrapButton from "./ScrapButton";
import ShareIconButton from "./ShareIconButton";
import dynamic from "next/dynamic";
const AdminDeleteButton = dynamic(() => import("@/components/admin-delete/AdminDeleteChrome").then((mod) => mod.AdminDeleteButton));

export default function ProjectCard({ project, index, adminDeleteActive = false, onDeleteProject }: { project: Project; index: number; adminDeleteActive?: boolean; onDeleteProject?: (project: Project) => void }) {
  const layout = project.cardLayout ?? "wide";

  return (
    <article className={`project-card project-card--${layout} ${adminDeleteActive ? "is-admin-delete" : ""}`}>
      <div className="project-card-image project-card-image-wrap">
        <Link href={adminDeleteActive ? `/project/view/?slug=${encodeURIComponent(project.slug)}&adminDelete=1&returnTo=%2Fadmin%2Fprojects` : `/project/view/?slug=${encodeURIComponent(project.slug)}`} aria-label={`${project.title} 프로젝트 보기`}>
          <picture>
            {project.mobileCoverImage && <source media="(max-width: 900px)" srcSet={project.mobileCoverImage} />}
            <Image src={project.coverImage} alt={`${project.title} 인테리어 대표 이미지`} width={layout === "portrait" ? 1100 : 1600} height={layout === "portrait" ? 1500 : layout === "square" ? 1200 : 1050} loading={index < 2 ? "eager" : "lazy"} fetchPriority={index < 2 ? "high" : "auto"} quality={82} unoptimized={project.coverImage.startsWith("data:")} sizes="(max-width:900px) calc(100vw - 36px), (max-width:1600px) calc((100vw - 480px) / 2), calc((100vw - 720px) / 2)" />
          </picture>
        </Link>
        {adminDeleteActive ? <AdminDeleteButton label={`${project.title} 삭제`} onDelete={() => onDeleteProject?.(project)} /> : <>
          <ScrapButton className="project-card-heart" item={{id:`project:${project.slug}`,kind:"project",projectSlug:project.slug,projectTitle:project.title,src:project.coverImage,alt:`${project.title} 대표 이미지`}} />
          <ShareIconButton className="project-card-share" projectSlug={project.slug} projectTitle={project.title} />
        </>}
      </div>
      <Link className="project-card-meta" href={adminDeleteActive ? `/project/view/?slug=${encodeURIComponent(project.slug)}&adminDelete=1&returnTo=%2Fadmin%2Fprojects` : `/project/view/?slug=${encodeURIComponent(project.slug)}`}>
        <div><h2>{project.title}</h2><p>{project.location} · {project.area}</p></div><span className="project-card-year">{project.year}</span>
      </Link>
    </article>
  );
}
