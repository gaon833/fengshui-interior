import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/project";
export default function ProjectCard({project}:{project:Project;index:number}){
  return <article className="project-card"><Link href={`/project/${project.slug}`}>
    <div className="project-card-image"><Image className="project-cover-desktop" src={project.coverImage} alt={project.title} width={1600} height={1100} sizes="(max-width:900px) 100vw, 50vw"/><Image className="project-cover-mobile" src={project.mobileCoverImage || project.coverImage} alt={`${project.title} 모바일 대표 이미지`} width={900} height={1300} sizes="100vw"/></div>
    <div className="project-card-meta"><div><h2>{project.title}</h2><p>{project.useType} · {project.area}</p></div><span className="project-card-year">{project.year}</span></div>
  </Link></article>;
}
