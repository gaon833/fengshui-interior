import Link from "next/link";
import AdminProjectList from "@/components/admin/AdminProjectList";
import { getAdminProjects } from "@/lib/projects";

export default function AdminProjectsPage() {
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>PROJECTS 관리</h1>
          <p>공개·작성 중·비공개·휴지통 프로젝트를 한 목록에서 조회합니다.</p>
        </div>
        <Link className="admin-primary-button" href="/admin/projects/new">새 프로젝트</Link>
      </div>
      <AdminProjectList projects={getAdminProjects()} />
    </>
  );
}
