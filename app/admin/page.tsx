import { getAdminProjects } from "@/lib/projects";

export default function AdminPage() {
  const projects = getAdminProjects();

  return (
    <>
      <h1>관리자 대시보드</h1>
      <div className="admin-stats">
        <article><strong>{projects.length}</strong><span>전체 프로젝트</span></article>
        <article><strong>{projects.filter((p) => p.status === "published").length}</strong><span>공개</span></article>
        <article><strong>{projects.filter((p) => p.status === "draft").length}</strong><span>작성 중</span></article>
        <article><strong>{projects.filter((p) => p.status === "trash").length}</strong><span>휴지통</span></article>
      </div>
      <div className="admin-note">
        조회수와 문의 통계는 실제 분석·예약 데이터 연결 단계에서 추가합니다.
      </div>
    </>
  );
}
