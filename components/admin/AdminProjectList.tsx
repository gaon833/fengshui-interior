"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Project, ProjectStatus } from "@/types/project";

const statusLabels: Record<ProjectStatus, string> = {
  published: "공개",
  draft: "작성 중",
  private: "비공개",
  trash: "휴지통",
};

export default function AdminProjectList({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      if (status !== "all" && project.status !== status) return false;
      if (!normalized) return true;
      return [
        project.title,
        project.location,
        project.area,
        project.category,
        project.status,
        ...project.tags,
      ].join(" ").toLowerCase().includes(normalized);
    });
  }, [projects, query, status]);

  return (
    <>
      <div className="admin-toolbar">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 지역, 평형, 태그 검색"
          aria-label="프로젝트 검색"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "all" | ProjectStatus)}
          aria-label="프로젝트 상태 필터"
        >
          <option value="all">전체 상태</option>
          <option value="published">공개</option>
          <option value="draft">작성 중</option>
          <option value="private">비공개</option>
          <option value="trash">휴지통</option>
        </select>
      </div>

      <div className="admin-table">
        {filteredProjects.length === 0 && (
          <div className="admin-empty">조건에 맞는 프로젝트가 없습니다.</div>
        )}
        {filteredProjects.map((project) => (
          <div className="admin-row admin-project-row" key={project.id}>
            <span className="drag-handle" aria-label="순서 변경">⋮⋮</span>
            <strong>{project.title}</strong>
            <span>{project.location}</span>
            <span>{project.area}</span>
            <span>{project.tags.join(", ")}</span>
            <span>{statusLabels[project.status]}</span>
            <Link href={`/admin/projects/${project.id}`}>수정</Link>
          </div>
        ))}
      </div>
    </>
  );
}
