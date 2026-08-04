"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/types/project";
import { PROJECTS_EVENT, PROJECTS_STORAGE_KEY, fetchServerProjects, readStoredProjects, saveStoredProjects } from "@/lib/project-store";
import ProjectFilterView from "./ProjectFilterView";
import { useAdminDeleteMode } from "@/lib/admin-delete-mode";
import { AdminDeleteChrome, confirmVisualDelete } from "@/components/admin-delete/AdminDeleteChrome";

export default function ProjectStoreView({ projects }: { projects: Project[] }) {
  const deleteMode = useAdminDeleteMode();
  const [items, setItems] = useState(projects);
  const [deleteSessionActive, setDeleteSessionActive] = useState(false);
  useEffect(() => {
    if (deleteMode.active) setDeleteSessionActive(true);
  }, [deleteMode.active]);

  useEffect(() => {
    let active = true;
    if (deleteSessionActive && !window.localStorage.getItem(PROJECTS_STORAGE_KEY)) saveStoredProjects(projects);
    const sync = () => setItems(readStoredProjects(projects).filter((item) => item.status === "published"));
    void fetchServerProjects(projects, deleteSessionActive).then((next) => { if (active) setItems(next.filter((item) => item.status === "published")); });
    window.addEventListener("storage", sync);
    window.addEventListener(PROJECTS_EVENT, sync);
    return () => {
      active = false;
      window.removeEventListener("storage", sync);
      window.removeEventListener(PROJECTS_EVENT, sync);
    };
  }, [projects, deleteSessionActive]);
  const removeProject = async (project: Project) => {
    if (!confirmVisualDelete(`${project.title} 프로젝트를 삭제하시겠습니까?`, "공개 화면에서 즉시 사라지고 휴지통으로 이동합니다.")) return;
    const now = new Date().toISOString();
    const allProjects = readStoredProjects(projects);
    const next = allProjects.map((item) => item.id === project.id
      ? { ...item, status: "trash" as const, deletedAt: now, updatedAt: now }
      : item);
    saveStoredProjects(next);
    setItems(next.filter((item) => item.status === "published"));
    await fetch("/api/admin/content-delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ kind: "project", id: project.slug }),
    }).catch(() => undefined);
  };

  return <div className={deleteSessionActive ? "admin-delete-page-shell is-project-delete" : undefined}>{deleteSessionActive && <AdminDeleteChrome label="PROJECTS 이미지 삭제" />}<ProjectFilterView projects={items} adminDeleteActive={deleteSessionActive} onDeleteProject={removeProject} /></div>;
}
