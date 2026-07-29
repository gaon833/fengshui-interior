"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/types/project";
import { PROJECTS_EVENT, readStoredProjects } from "@/lib/project-store";
import ProjectFilterView from "./ProjectFilterView";

export default function ProjectStoreView({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState(projects);
  useEffect(() => {
    const sync = () => setItems(readStoredProjects(projects).filter((item) => item.status === "published"));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PROJECTS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PROJECTS_EVENT, sync);
    };
  }, [projects]);
  return <ProjectFilterView projects={items} />;
}
