import { notFound } from "next/navigation";
import Image from "next/image";
import ProjectInfo from "@/components/project/ProjectInfo";
import ProjectGallery from "@/components/project/ProjectGallery";
import ProjectNavigation from "@/components/project/ProjectNavigation";
import StructuredData from "@/components/site/StructuredData";
import ScrapButton from "@/components/project/ScrapButton";
import ShareIconButton from "@/components/project/ShareIconButton";
import { getAdjacentProjects, getProjectBySlug, getProjects } from "@/lib/projects";

export const dynamicParams = false;
export function generateStaticParams() { return getProjects().map((project) => ({ slug: project.slug })); }

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  const { prev, next } = getAdjacentProjects(slug);

  return (
    <>
      <StructuredData project={{ title: project.title, description: project.seo.description, image: project.seo.ogImage || project.coverImage, url: `/project/${project.slug}/` }} />
      <article className="project-detail-page">
      <ProjectInfo project={project} />
      <section className="detail-gallery">
        <figure className="detail-photo landscape detail-cover"><div className="detail-photo-inner"><Image src={project.coverImage} alt={project.title} width={1600} height={1050} priority quality={82} sizes="(max-width:900px) 100vw, 70vw" /><ScrapButton className="detail-image-heart" item={{id:`project:${project.slug}`,kind:"project",projectSlug:project.slug,projectTitle:project.title,src:project.coverImage,alt:`${project.title} 대표 이미지`}} />
        <ShareIconButton className="detail-image-share" projectSlug={project.slug} projectTitle={project.title} /></div></figure>
        <ProjectGallery images={project.images} projectSlug={project.slug} projectTitle={project.title} />
      </section>
      <ProjectNavigation prev={prev} next={next} />
      </article>
    </>
  );
}
