"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Project, ProjectStatus } from "@/types/project";
import { PROJECTS_EVENT, readStoredProjects, saveStoredProjects } from "@/lib/project-store";
import { showAdminToast } from "@/lib/admin-toast";

const statusLabels: Record<ProjectStatus, string> = { published: "공개", draft: "작성 중", private: "비공개", trash: "휴지통" };

export default function AdminProjectList({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState<Project[]>(projects);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");

  useEffect(() => {
    const sync = () => setItems(readStoredProjects(projects));
    sync();
    window.addEventListener(PROJECTS_EVENT, sync);
    window.addEventListener("storage", sync);
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

  const move = (id: string, direction: -1 | 1) => {
    const ordered = [...items].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const next = ordered.map((item, order) => ({ ...item, order: order + 1, updatedAt: new Date().toISOString() }));
    saveStoredProjects(next); setItems(next); showAdminToast("프로젝트 노출 순서가 변경되었습니다.", "success");
  };

  const remove = (id: string) => {
    if (!window.confirm("이 프로젝트를 휴지통으로 이동할까요?")) return;
    const next = items.map((item) => item.id === id ? { ...item, status: "trash" as const, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : item);
    saveStoredProjects(next); setItems(next); showAdminToast("프로젝트가 휴지통으로 이동되었습니다.", "success");
  };

  const restoreDefaults = () => {
    if (!window.confirm("기본 프로젝트 목록으로 복원할까요?")) return;
    window.localStorage.removeItem("fengshui-admin-projects-v3");
    showAdminToast("기본 프로젝트 목록으로 복원되었습니다.", "success");
    window.setTimeout(() => window.location.reload(), 450);
  };

  return <>
    <div className="admin-toolbar">
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="제목, 지역, 평형, 태그 검색" aria-label="프로젝트 검색" />
      <select value={status} onChange={(e) => setStatus(e.target.value as "all" | ProjectStatus)} aria-label="프로젝트 상태 필터">
        <option value="all">전체 상태</option><option value="published">공개</option><option value="draft">작성 중</option><option value="private">비공개</option><option value="trash">휴지통</option>
      </select>
      <button className="admin-filter-button" type="button" onClick={restoreDefaults}>기본 프로젝트 복원</button>
    </div>
    <div className="admin-table">
      {filteredProjects.length === 0 && <div className="admin-empty">조건에 맞는 프로젝트가 없습니다.</div>}
      {filteredProjects.map((project) => <div className="admin-row admin-project-row" key={project.id}>
        <span className="order-buttons"><button type="button" onClick={() => move(project.id, -1)}>↑</button><button type="button" onClick={() => move(project.id, 1)}>↓</button></span>
        <strong>{project.title}</strong><span>{project.location}</span><span>{project.area}</span><span>{project.tags.join(", ")}</span><span>{statusLabels[project.status]}</span>
        <span className="row-actions"><Link href={`/admin/projects/new/?id=${encodeURIComponent(project.id)}`}>수정</Link><Link href={`/project/view/?slug=${encodeURIComponent(project.slug)}&adminDelete=1&returnTo=%2Fadmin%2Fprojects`}>이미지 삭제</Link></span>
      </div>)}
    </div>
  </>;
}
