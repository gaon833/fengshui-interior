"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Project, ProjectStatus } from "@/types/project";
import { PROJECTS_EVENT, readStoredProjects, saveStoredProjects } from "@/lib/project-store";
import { showAdminToast } from "@/lib/admin-toast";
import AdminDeleteLightbox from "@/components/admin/AdminDeleteLightbox";

export default function AdminProjectList({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState<Project[]>(projects);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [selected, setSelected] = useState<Project | null>(null);

  useEffect(() => {
    const sync = () => setItems(readStoredProjects(projects));
    sync(); window.addEventListener(PROJECTS_EVENT, sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener(PROJECTS_EVENT, sync); window.removeEventListener("storage", sync); };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((project) => {
      if (status !== "all" && project.status !== status) return false;
      if (!normalized) return true;
      return [project.title, project.location, project.area, project.category, project.status, ...project.tags].join(" ").toLowerCase().includes(normalized);
    });
  }, [items, query, status]);

  const remove = (id: string) => {
    const next = items.map((item) => item.id === id ? { ...item, status: "trash" as const, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : item);
    saveStoredProjects(next); setItems(next); showAdminToast("프로젝트가 삭제되었습니다.", "success");
  };

  const restoreDefaults = () => {
    if (!window.confirm("기본 프로젝트 목록으로 복원할까요?")) return;
    window.localStorage.removeItem("fengshui-admin-projects-v3");
    showAdminToast("기본 프로젝트 목록으로 복원되었습니다.", "success");
    window.setTimeout(() => window.location.reload(), 450);
  };

  const visibleProjects = filteredProjects.filter((project) => project.status !== "trash");

  return <>
    <div className="admin-toolbar">
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="제목, 지역, 평형, 태그 검색" aria-label="프로젝트 검색" />
      <select value={status} onChange={(e) => setStatus(e.target.value as "all" | ProjectStatus)} aria-label="프로젝트 상태 필터">
        <option value="all">전체 상태</option><option value="published">공개</option><option value="draft">작성 중</option><option value="private">비공개</option><option value="trash">휴지통</option>
      </select>
      <button className="admin-filter-button" type="button" onClick={restoreDefaults}>기본 프로젝트 복원</button>
    </div>

    <div className="admin-visual-manager-heading"><p>공개 PROJECTS와 같은 이미지 화면입니다. 사진을 클릭하면 크게 열리고, 오른쪽 위 ×로 삭제할 수 있습니다.</p></div>
    {visibleProjects.length === 0 ? <div className="admin-empty">조건에 맞는 프로젝트가 없습니다.</div> : <div className="admin-project-visual-grid">
      {visibleProjects.map((project) => <article className={`admin-project-visual-card admin-project-visual-card--${project.cardLayout || "wide"}`} key={project.id}>
        <button type="button" className="admin-project-visual-image" onClick={() => setSelected(project)} aria-label={`${project.title} 크게 보기 및 삭제`}>
          <Image src={project.coverImage} alt={`${project.title} 대표 이미지`} width={project.cardLayout === "portrait" ? 1100 : 1600} height={project.cardLayout === "portrait" ? 1500 : 1050} sizes="(max-width:900px) calc(100vw - 40px), 40vw" unoptimized={project.coverImage.startsWith("data:")} />
        </button>
        <div className="admin-project-visual-meta"><div><strong>{project.title}</strong><span>{project.location} · {project.area}</span></div><Link href={`/admin/projects/new/?id=${encodeURIComponent(project.id)}`}>수정</Link></div>
      </article>)}
    </div>}

    <AdminDeleteLightbox open={Boolean(selected)} src={selected?.coverImage || ""} alt={selected ? `${selected.title} 대표 이미지` : "프로젝트 대표 이미지"} kindLabel="프로젝트" onClose={() => setSelected(null)} onDelete={() => { if (selected) remove(selected.id); }} />
  </>;
}
