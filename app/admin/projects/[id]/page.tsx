import { notFound } from "next/navigation";
import ProjectEditor from "@/components/admin/ProjectEditor";
import { getProjectById } from "@/lib/projects";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) notFound();

  return (
    <>
      <ProjectEditor initialProject={project} />
    </>
  );
}
