import type { Project } from "@/types/project";
import ProjectCard from "./ProjectCard";
export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const left=projects.filter((_,i)=>i%2===0); const right=projects.filter((_,i)=>i%2===1);
  return <section className="project-grid">
    <div className="project-column">{left.map((p,i)=><ProjectCard key={p.id} project={p} index={i*2}/>)}</div>
    <div className="project-column">{right.map((p,i)=><ProjectCard key={p.id} project={p} index={i*2+1}/>)}</div>
  </section>;
}
