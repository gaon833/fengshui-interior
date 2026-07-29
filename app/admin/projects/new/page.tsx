import { Suspense } from "react";
import ProjectEditor from "@/components/admin/ProjectEditor";
import { getAdminProjects } from "@/lib/projects";
export default function NewProjectPage() { return <Suspense fallback={<p>편집기를 불러오는 중입니다.</p>}><ProjectEditor defaults={getAdminProjects()} /></Suspense>; }
