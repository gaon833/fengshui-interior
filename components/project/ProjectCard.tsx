import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/project";
export default function ProjectCard({ project }: { project: Project; index: number }) {
  const portrait = project.coverOrientation === "portrait";
  return <article className={`project-card ${portrait ? "is-portrait" : "is-landscape"}`}><Link href={`/project/${project.slug}`}>
    <div className="project-card-image"><Image src={project.coverImage} alt={project.title} width={portrait ? 820 : 1600} height={portrait ? 1180 : 1050} sizes="(max-width:900px) 100vw, 50vw"/></div>
    <div className="project-card-meta"><div><h2>{project.title}</h2><p>{project.useType} · {project.area}</p></div><span className="project-card-year">{project.year}</span></div>
  </Link></article>;
}
