import { notFound } from "next/navigation";
import Image from "next/image";
import ProjectInfo from "@/components/project/ProjectInfo";
import ProjectGallery from "@/components/project/ProjectGallery";
import ProjectNavigation from "@/components/project/ProjectNavigation";
import { getAdjacentProjects, getProjectBySlug, getProjects } from "@/lib/projects";

export const dynamicParams = false;
export function generateStaticParams() { return getProjects().map((project) => ({ slug: project.slug })); }

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const { prev, next } = getAdjacentProjects(slug);

  return (
    <article className="project-detail-page">
      <ProjectInfo project={project} />
      <section className="detail-gallery">
        <figure className="detail-photo landscape detail-cover">
          <Image src={project.coverImage} alt={project.title} width={1600} height={1050} priority sizes="(max-width:900px) 100vw, 70vw" />
        </figure>
        <ProjectGallery images={project.images} />
      </section>
      <ProjectNavigation prev={prev} next={next} />
    </article>
  );
}
