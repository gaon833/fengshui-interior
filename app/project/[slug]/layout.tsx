import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProjectDetailShell from "@/components/layout/ProjectDetailShell";
import PublicContentProtection from "@/components/site/PublicContentProtection";
import { getProjectBySlug } from "@/lib/projects";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: project.seo.title || project.title,
    description: project.seo.description,
    alternates: { canonical: `/project/${project.slug}/` },
    openGraph: {
      type: "article",
      title: project.seo.title || project.title,
      description: project.seo.description,
      url: `/project/${project.slug}/`,
      images: [{ url: project.seo.ogImage || project.coverImage, alt: project.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: project.seo.title || project.title,
      description: project.seo.description,
      images: [project.seo.ogImage || project.coverImage],
    },
  };
}

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return (
    <PublicContentProtection>
      <ProjectDetailShell>{children}</ProjectDetailShell>
    </PublicContentProtection>
  );
}
