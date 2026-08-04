"use client";
import { useEffect, useState } from "react";
import type { Project } from "@/types/project";
import { PROJECTS_EVENT, fetchServerProjects, readStoredProjects, saveStoredProjects } from "@/lib/project-store";
import { showAdminToast } from "@/lib/admin-toast";

export default function TrashManager({projects}:{projects:Project[]}){
  const [items,setItems]=useState<Project[]>([]);
  useEffect(()=>{let active=true;const sync=()=>setItems(readStoredProjects(projects).filter((p)=>p.status==="trash"));void fetchServerProjects(projects,true).then((next)=>{if(active)setItems(next.filter((p)=>p.status==="trash"));});window.addEventListener(PROJECTS_EVENT,sync);window.addEventListener("storage",sync);return()=>{active=false;window.removeEventListener(PROJECTS_EVENT,sync);window.removeEventListener("storage",sync);};},[projects]);
  const all=()=>readStoredProjects(projects);
  const restore=(id:string)=>{const next=all().map((p)=>p.id===id?{...p,status:"draft" as const,deletedAt:undefined,updatedAt:new Date().toISOString()}:p);saveStoredProjects(next);setItems(next.filter((p)=>p.status==="trash"));showAdminToast("프로젝트가 복원되었습니다.","success");};
  const destroy=(id:string)=>{if(!window.confirm("이 프로젝트를 영구 삭제할까요? 복원할 수 없습니다."))return;const next=all().filter((p)=>p.id!==id);saveStoredProjects(next);setItems(next.filter((p)=>p.status==="trash"));showAdminToast("프로젝트가 영구 삭제되었습니다.","success");};
  return <><h1>휴지통</h1><p>삭제한 프로젝트를 복원하거나 영구 삭제할 수 있습니다.</p><div className="admin-table">{items.length===0&&<div className="admin-empty">휴지통이 비어 있습니다.</div>}{items.map((project)=><div className="admin-row" key={project.id}><strong>{project.title}</strong><span>{project.deletedAt?new Date(project.deletedAt).toLocaleString("ko-KR"):"-"}</span><button type="button" onClick={()=>restore(project.id)}>복원</button><button type="button" onClick={()=>destroy(project.id)}>영구 삭제</button></div>)}</div></>;
}
