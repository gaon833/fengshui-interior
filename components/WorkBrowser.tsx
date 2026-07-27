"use client";

import { useMemo, useState } from "react";
import ProjectCard from "./ProjectCard";
import type { Project } from "@/content/data";

const styleFilters = ["All", "Modern", "Unique"] as const;
const sizeFilters = ["All", "20", "30", "40", "50", "60", "C"] as const;

export default function WorkBrowser({ projects }: { projects: Project[] }) {
  const [style, setStyle] = useState<(typeof styleFilters)[number]>("All");
  const [size, setSize] = useState<(typeof sizeFilters)[number]>("All");

  const visibleProjects = useMemo(() => {
    return projects.filter((project) => {
      const styleMatch = style === "All" || project.style === style;
      const sizeMatch = size === "All" || project.sizeGroup === size;
      return styleMatch && sizeMatch;
    });
  }, [projects, style, size]);

  return (
    <>
      <section className="referenceFilters" aria-label="프로젝트 필터">
        <div className="filterRow">
          {styleFilters.map((item) => (
            <button
              key={item}
              type="button"
              className={style === item ? "active" : ""}
              onClick={() => setStyle(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="filterRow sizeRow">
          {sizeFilters.map((item) => (
            <button
              key={item}
              type="button"
              className={size === item ? "active" : ""}
              onClick={() => setSize(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="projectGrid">
        {visibleProjects.map((project) => (
          <ProjectCard project={project} key={project.slug} />
        ))}
      </section>
    </>
  );
}
