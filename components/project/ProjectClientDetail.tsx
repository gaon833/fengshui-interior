"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { Project } from "@/types/project";
import { readStoredProjects } from "@/lib/project-store";
import ProjectInfo from "./ProjectInfo";
import ProjectGallery from "./ProjectGallery";

export default function ProjectClientDetail({ defaults }: { defaults: Project[] }) {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const projects = useMemo(() => readStoredProjects(defaults).filter((item) => item.status === "published"), [defaults]);
  const index = projects.findIndex((item) => item.slug === slug);
  const project = index >= 0 ? projects[index] : undefined;

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
    <article className="project-detail-page">
      <ProjectInfo project={project} />
      <section className="detail-gallery">
        <figure className="detail-photo landscape detail-cover">
          <Image src={project.coverImage} alt={project.title} width={1600} height={1050} priority unoptimized={project.coverImage.startsWith("data:")} sizes="(max-width:900px) 100vw, 70vw" />
        </figure>
        <ProjectGallery images={project.images} />
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
    </article>
  );
}
