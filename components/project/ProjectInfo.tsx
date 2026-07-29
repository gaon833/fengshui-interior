"use client";

import type { Project } from "@/types/project";

export default function ProjectInfo({ project }: { project: Project }) {
  return (
    <aside className="detail-info">
      <section className="detail-meta">
        <h1>{project.title}</h1>
        <p className="project-type">{project.useType}</p>
        <dl>
          <div>
            <dt>주거형태</dt>
            <dd>{project.useType === "Residential" ? "아파트" : project.useType}</dd>
          </div>
          <div>
            <dt>면적</dt>
            <dd>{project.area}</dd>
          </div>
          <div>
            <dt>위치</dt>
            <dd>{project.location}</dd>
          </div>
          <div>
            <dt>연도</dt>
            <dd>{project.year}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
