"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Project, ProjectStatus } from "@/types/project";
import { PROJECTS_EVENT, fetchServerProjects, readStoredProjects, saveStoredProjects, syncProjectsToServer } from "@/lib/project-store";
import { showAdminToast } from "@/lib/admin-toast";
import styles from "./Projects.module.css";

const statusLabels: Record<ProjectStatus, string> = { published: "공개", draft: "작성 중", private: "비공개", trash: "휴지통" };
const PAGE_SIZE = 6;

function Icon({ name }: { name: "search" | "edit" | "trash" | "restore" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "search") return <svg className={styles.icon} viewBox="0 0 24 24" {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
  if (name === "edit") return <svg className={styles.icon} viewBox="0 0 24 24" {...common}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>;
  if (name === "trash") return <svg className={styles.icon} viewBox="0 0 24 24" {...common}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>;
  return <svg className={styles.icon} viewBox="0 0 24 24" {...common}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></svg>;
}

export default function AdminProjectList({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState<Project[]>(projects);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const sync = () => setItems(readStoredProjects(projects));
    void fetchServerProjects(projects, true).then((next) => { if (active) setItems(next); });
    window.addEventListener(PROJECTS_EVENT, sync); window.addEventListener("storage", sync);
    return () => { active = false; window.removeEventListener(PROJECTS_EVENT, sync); window.removeEventListener("storage", sync); };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...items]
      .filter((project) => project.status !== "trash")
      .sort((a,b)=>(b.order ?? 0)-(a.order ?? 0))
      .filter((project) => {
        if (status !== "all" && project.status !== status) return false;
        if (!normalized) return true;
        return [project.title, project.location, project.area, project.category, project.status, ...project.tags].join(" ").toLowerCase().includes(normalized);
      });
  }, [items, query, status]);
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filteredProjects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const move = (id: string, direction: -1 | 1) => {
    const ordered = [...items].sort((a, b) => (b.order ?? 0) - (a.order ?? 0)); const index = ordered.findIndex((item) => item.id === id); const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const total = ordered.length;
    const now = new Date().toISOString();
    const next = ordered.map((item, index) => ({ ...item, order: total - index, updatedAt: now }));
    saveStoredProjects(next); setItems(next); showAdminToast("프로젝트 노출 순서가 변경되었습니다.", "success");
  };
  const restoreDefaults = async () => { if (!window.confirm("기본 프로젝트 목록으로 복원할까요?")) return; try { const stored=await syncProjectsToServer(projects); window.localStorage.setItem("fengshui-admin-projects-v3", JSON.stringify(stored)); setItems(stored); showAdminToast("기본 프로젝트 목록이 서버에 복원되었습니다.", "success"); } catch(error){ showAdminToast(error instanceof Error?error.message:"복원에 실패했습니다.","error"); } };

  return <>
    <div className={styles.toolbar}>
      <div className={styles.searchWrap}><span className={styles.searchIcon}><Icon name="search" /></span><input className={styles.search} type="search" value={query} onChange={(e) => {setQuery(e.target.value);setPage(1);}} placeholder="제목, 지역, 평형, 태그 검색" aria-label="프로젝트 검색" /></div>
      <select className={styles.select} value={status} onChange={(e) => {setStatus(e.target.value as "all" | ProjectStatus);setPage(1);}} aria-label="프로젝트 상태 필터"><option value="all">전체 상태</option><option value="published">공개</option><option value="draft">작성 중</option><option value="private">비공개</option></select>
      <button className={styles.button} type="button" onClick={()=>void restoreDefaults()}><Icon name="restore" />기본 프로젝트 복원</button>
    </div>
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}><span>순서</span><span>프로젝트명</span><span>지역</span><span>평형</span><span>태그</span><span>상태</span><span>관리</span></div>
      {visible.length === 0 ? <div className={styles.empty}>조건에 맞는 프로젝트가 없습니다.</div> : visible.map((project) => <div className={styles.row} key={project.id}>
        <span className={styles.orderCell}><button className={styles.orderButton} type="button" onClick={() => move(project.id, -1)}>↑</button><span className={styles.drag}>⋮⋮</span></span>
        <strong className={styles.projectName}>{project.title}</strong><span className={styles.muted}>{project.location}</span><span className={styles.muted}>{project.area}</span><span className={styles.muted}>{project.tags.join(", ")}</span><span className={styles.status}>{statusLabels[project.status]}</span>
        <span className={styles.rowActions}><Link className={styles.actionButton} href={`/admin/projects/new/?id=${encodeURIComponent(project.id)}`}><Icon name="edit" />수정</Link><Link className={styles.actionButton} href={`/project/view/?slug=${encodeURIComponent(project.slug)}&adminDelete=1&returnTo=%2Fadmin%2Fprojects`}><Icon name="trash" />이미지 삭제</Link></span>
      </div>)}
    </div>
    {totalPages > 1 && <div className={styles.pagination}><div className={styles.paginationInner}><button className={styles.pageButton} onClick={()=>setPage(Math.max(1,currentPage-1))}>‹</button>{Array.from({length:totalPages},(_,i)=>i+1).slice(0,10).map(n=><button key={n} className={`${styles.pageButton} ${n===currentPage?styles.pageActive:""}`} onClick={()=>setPage(n)}>{n}</button>)}<button className={styles.pageButton} onClick={()=>setPage(Math.min(totalPages,currentPage+1))}>›</button></div></div>}
  </>;
}
