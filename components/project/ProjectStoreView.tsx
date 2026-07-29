"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/types/project";
import { PROJECTS_EVENT, PROJECTS_STORAGE_KEY, readStoredProjects, saveStoredProjects } from "@/lib/project-store";
import ProjectFilterView from "./ProjectFilterView";
import { useAdminDeleteMode } from "@/lib/admin-delete-mode";
import { AdminDeleteChrome } from "@/components/admin-delete/AdminDeleteChrome";

export default function ProjectStoreView({ projects }: { projects: Project[] }) {
  const deleteMode = useAdminDeleteMode();
  const [items, setItems] = useState(projects);
  useEffect(() => {
    if (deleteMode.active && !window.localStorage.getItem(PROJECTS_STORAGE_KEY)) saveStoredProjects(projects);
    const sync = () => setItems(readStoredProjects(projects).filter((item) => item.status === "published"));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PROJECTS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PROJECTS_EVENT, sync);
    };
  }, [projects, deleteMode.active]);
  return <>{deleteMode.active && <AdminDeleteChrome label="PROJECTS 삭제 모드" />}<ProjectFilterView projects={items} /></>;
}
