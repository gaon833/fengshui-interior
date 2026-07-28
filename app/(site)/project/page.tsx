import Link from "next/link";
import ProjectGrid from "@/components/project/ProjectGrid";
import { getProjectsByCategory, PROJECT_CATEGORIES } from "@/lib/projects";

export default async function ProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = PROJECT_CATEGORIES.includes(category as (typeof PROJECT_CATEGORIES)[number])
    ? category ?? "ALL"
    : "ALL";
  const projects = getProjectsByCategory(activeCategory);

  return (
    <div className="project-index">
      <nav className="project-filter" aria-label="프로젝트 필터">
        {PROJECT_CATEGORIES.map((item) => (
          <Link
            key={item}
            className={activeCategory === item ? "is-active" : undefined}
            href={item === "ALL" ? "/project" : `/project?category=${item}`}
            scroll={false}
          >
            {item}
          </Link>
        ))}
      </nav>
      <ProjectGrid projects={projects} />
      {projects.length === 0 && <p className="project-empty">해당 카테고리의 공개 프로젝트가 없습니다.</p>}
    </div>
  );
}
