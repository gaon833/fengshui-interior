"use client";

import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/project";
import ScrapButton from "./ScrapButton";
import ShareIconButton from "./ShareIconButton";
import { readStoredProjects, saveStoredProjects } from "@/lib/project-store";
import { useAdminDeleteMode } from "@/lib/admin-delete-mode";
import { AdminDeleteButton, confirmVisualDelete } from "@/components/admin-delete/AdminDeleteChrome";

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const layout = project.cardLayout ?? "wide";
  const deleteMode = useAdminDeleteMode();

  const removeProject = async () => {
    if (!confirmVisualDelete(`${project.title} 프로젝트를 삭제하시겠습니까?`, "공개 화면에서 즉시 사라지고 휴지통으로 이동합니다.")) return;
    const defaults = readStoredProjects([]);
    const current = defaults.length ? defaults : [project];
    const next = current.map((item) => item.id === project.id ? { ...item, status: "trash" as const, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : item);
    saveStoredProjects(next);
    await fetch("/api/admin/content-delete", { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ kind: "project", id: project.slug }) }).catch(() => undefined);
  };

  return (
    <article className={`project-card project-card--${layout} ${deleteMode.active ? "is-admin-delete" : ""}`}>
      <div className="project-card-image">
        <Link href={deleteMode.active ? `/project/view/?slug=${encodeURIComponent(project.slug)}&adminDelete=1` : `/project/view/?slug=${encodeURIComponent(project.slug)}`} aria-label={`${project.title} 프로젝트 보기`}>
          <picture>
            {project.mobileCoverImage && <source media="(max-width: 900px)" srcSet={project.mobileCoverImage} />}
            <Image src={project.coverImage} alt={`${project.title} 인테리어 대표 이미지`} width={layout === "portrait" ? 1100 : 1600} height={layout === "portrait" ? 1500 : layout === "square" ? 1200 : 1050} loading={index < 2 ? "eager" : "lazy"} fetchPriority={index < 2 ? "high" : "auto"} quality={82} unoptimized={project.coverImage.startsWith("data:")} sizes="(max-width:900px) calc(100vw - 36px), (max-width:1600px) calc((100vw - 480px) / 2), calc((100vw - 720px) / 2)" />
          </picture>
        </Link>
        {deleteMode.active ? <AdminDeleteButton label={`${project.title} 삭제`} onDelete={() => void removeProject()} /> : <>
          <ScrapButton className="project-card-heart" item={{id:`project:${project.slug}`,kind:"project",projectSlug:project.slug,projectTitle:project.title,src:project.coverImage,alt:`${project.title} 대표 이미지`}} />
          <ShareIconButton className="project-card-share" projectSlug={project.slug} projectTitle={project.title} />
        </>}
      </div>
      <Link className="project-card-meta" href={deleteMode.active ? `/project/view/?slug=${encodeURIComponent(project.slug)}&adminDelete=1` : `/project/view/?slug=${encodeURIComponent(project.slug)}`}>
        <div><h2>{project.title}</h2><p>{project.location} · {project.area}</p></div><span className="project-card-year">{project.year}</span>
      </Link>
    </article>
  );
}
