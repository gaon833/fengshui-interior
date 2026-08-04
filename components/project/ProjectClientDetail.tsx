"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminDeleteMode } from "@/lib/admin-delete-mode";
import { AdminDeleteChrome } from "@/components/admin-delete/AdminDeleteChrome";
import type { Project } from "@/types/project";
import { fetchServerProjects } from "@/lib/project-store";
import ProjectInfo from "./ProjectInfo";
import ProjectGallery from "./ProjectGallery";
import ScrapButton from "./ScrapButton";
import ShareIconButton from "./ShareIconButton";
import { trackEngagement } from "@/lib/engagement";

export default function ProjectClientDetail({ defaults }: { defaults: Project[] }) {
  const searchParams = useSearchParams();
  const deleteMode = useAdminDeleteMode();
  const slug = searchParams.get("slug") ?? "";
  const [projects, setProjects] = useState<Project[]>(defaults.filter((item) => item.status === "published"));
  useEffect(() => { let active = true; void fetchServerProjects(defaults, deleteMode.active).then((next) => { if (active) setProjects(next.filter((item) => item.status === "published")); }); return () => { active = false; }; }, [defaults, deleteMode.active]);
  const index = projects.findIndex((item) => item.slug === slug);
  const project = index >= 0 ? projects[index] : undefined;

  useEffect(() => {
    if (project) trackEngagement({type:"view",projectSlug:project.slug,projectTitle:project.title,target:"project"});
  }, [project?.slug]);

  if (!project) {
    return (
      <div className="project-detail-page">
        <p className="project-empty">프로젝트를 찾을 수 없습니다.</p>
        <Link href="/project/">PROJECTS로 돌아가기</Link>
      </div>
    );
  }

  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <>{deleteMode.active && <AdminDeleteChrome label="프로젝트 상세 이미지 삭제" />}<article className="project-detail-page">
      <ProjectInfo project={project} />
      <section className="detail-gallery">
        <figure className="detail-photo landscape detail-cover"><div className="detail-photo-inner"><Image src={project.coverImage} alt={project.title} width={1600} height={1050} priority unoptimized={project.coverImage.startsWith("data:")} sizes="(max-width:900px) 100vw, 70vw" />{!deleteMode.active && <><ScrapButton className="detail-image-heart" item={{id:`project:${project.slug}`,kind:"project",projectSlug:project.slug,projectTitle:project.title,src:project.coverImage,alt:`${project.title} 대표 이미지`}} /><ShareIconButton className="detail-image-share" projectSlug={project.slug} projectTitle={project.title} /></>}</div></figure>
        <ProjectGallery images={project.images} projectSlug={project.slug} projectTitle={project.title} />
      </section>
      <nav className="project-navigation" aria-label="이전·다음 프로젝트">
        <div>
          <Link className="prev" href={`/project/view/?slug=${encodeURIComponent(prev.slug)}`} aria-label="이전 프로젝트">
            <span className="nav-arrow nav-arrow--prev" aria-hidden="true" />
            <span>PREV</span>
          </Link>
        </div>
        <div>
          <Link className="next" href={`/project/view/?slug=${encodeURIComponent(next.slug)}`} aria-label="다음 프로젝트">
            <span>NEXT</span>
            <span className="nav-arrow nav-arrow--next" aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </article></>
  );
}
