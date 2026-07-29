import Link from "next/link";
import AdminProjectList from "@/components/admin/AdminProjectList";
import { getAdminProjects } from "@/lib/projects";

export default function AdminProjectsPage() {
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>PROJECTS 관리</h1>
          <p>홈페이지와 같은 이미지 화면에서 프로젝트를 확인하고 삭제할 수 있습니다.</p>
        </div>
        <Link className="admin-primary-button" href="/admin/projects/new">새 프로젝트</Link>
      </div>
      <AdminProjectList projects={getAdminProjects()} />
    </>
  );
}
