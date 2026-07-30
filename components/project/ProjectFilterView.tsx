"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/types/project";
import ProjectGrid from "./ProjectGrid";

const categories = ["ALL", "20", "30", "40", "50", "60", "C"] as const;
type Category = (typeof categories)[number];

export default function ProjectFilterView({ projects, adminDeleteActive = false, onDeleteProject }: { projects: Project[]; adminDeleteActive?: boolean; onDeleteProject?: (project: Project) => void }) {
  const [activeCategory, setActiveCategory] = useState<Category>("ALL");
  const newestProjects = useMemo(() => [...projects].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
    const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
    if (aTime !== bTime) return bTime - aTime;
    return (b.order ?? 0) - (a.order ?? 0);
  }), [projects]);

  const filteredProjects = useMemo(
    () => activeCategory === "ALL"
      ? newestProjects
      : newestProjects.filter((project) => project.category === activeCategory),
    [activeCategory, newestProjects],
  );

  return (
    <>
      <nav className="project-filter" aria-label="프로젝트 필터">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={activeCategory === item ? "is-active" : undefined}
            aria-pressed={activeCategory === item}
            onClick={() => setActiveCategory(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      <ProjectGrid projects={filteredProjects} adminDeleteActive={adminDeleteActive} onDeleteProject={onDeleteProject} />
      {filteredProjects.length === 0 && (
        <p className="project-empty">해당 카테고리의 공개 프로젝트가 없습니다.</p>
      )}
    </>
  );
}
