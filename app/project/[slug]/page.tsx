import { notFound } from "next/navigation";
import Image from "next/image";
import ProjectInfo from "@/components/project/ProjectInfo";
import ProjectGallery from "@/components/project/ProjectGallery";
import ProjectNavigation from "@/components/project/ProjectNavigation";
import { getAdjacentProjects, getProjectBySlug, getProjects } from "@/lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { prev, next } = getAdjacentProjects(slug);

  return (
    <article className="project-detail">
      <div className="project-detail-intro">
        <ProjectInfo project={project} />
        <div className="project-hero">
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 62vw"
          />
        </div>
      </div>

      <ProjectGallery images={project.images} />
      <ProjectNavigation prev={prev} next={next} />
    </article>
  );
}
