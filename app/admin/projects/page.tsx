import Link from "next/link";
import { filterAdminProjects } from "@/lib/projects";

const statusLabels = {
  published: "공개",
  draft: "작성 중",
  private: "비공개",
  trash: "휴지통",
} as const;

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "all" } = await searchParams;
  const projects = filterAdminProjects(q, status);

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>프로젝트 관리</h1>
          <p>공개·작성 중·비공개·휴지통 프로젝트를 한 목록에서 조회합니다.</p>
        </div>
        <Link className="admin-primary-button" href="/admin/projects/new">새 프로젝트</Link>
      </div>

      <form className="admin-toolbar" action="/admin/projects" method="get">
        <input name="q" type="search" defaultValue={q} placeholder="제목, 지역, 평형, 태그 검색" />
        <select name="status" defaultValue={status}>
          <option value="all">전체 상태</option>
          <option value="published">공개</option>
          <option value="draft">작성 중</option>
          <option value="private">비공개</option>
          <option value="trash">휴지통</option>
        </select>
        <button className="admin-filter-button" type="submit">검색</button>
      </form>

      <div className="admin-table">
        {projects.length === 0 && <div className="admin-empty">조건에 맞는 프로젝트가 없습니다.</div>}
        {projects.map((project) => (
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
