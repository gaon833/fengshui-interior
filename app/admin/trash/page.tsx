import { getTrashedProjects } from "@/lib/projects";

export default function TrashPage() {
  const projects = getTrashedProjects();

  return (
    <>
      <h1>휴지통</h1>
      <p>삭제 즉시 제거하지 않고 복원할 수 있도록 보관하는 영역입니다.</p>
      <div className="admin-table">
        {projects.length === 0 && <div className="admin-empty">휴지통이 비어 있습니다.</div>}
        {projects.map((project) => (
          <div className="admin-row" key={project.id}>
            <strong>{project.title}</strong>
            <span>{project.deletedAt ?? "-"}</span>
            <button type="button">복원</button>
            <button type="button">영구 삭제</button>
          </div>
        ))}
      </div>
    </>
  );
}
