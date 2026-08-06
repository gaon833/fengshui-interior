"use client";
import { useEffect, useState } from "react";
import type { Project } from "@/types/project";
import {
  PROJECTS_EVENT,
  deleteProjectPermanentlyFromServer,
  fetchServerProjects,
  readStoredProjects,
  saveProjectToServer,
  cacheStoredProjects,
} from "@/lib/project-store";
import { showAdminToast } from "@/lib/admin-toast";

export default function TrashManager({projects}:{projects:Project[]}){
  const [items,setItems]=useState<Project[]>([]);
  const [busyId,setBusyId]=useState<string>("");

  useEffect(()=>{
    let active=true;
    const sync=()=>setItems(readStoredProjects(projects).filter((p)=>p.status==="trash"));
    void fetchServerProjects(projects,true).then((next)=>{
      if(active)setItems(next.filter((p)=>p.status==="trash"));
    });
    window.addEventListener(PROJECTS_EVENT,sync);
    window.addEventListener("storage",sync);
    return()=>{
      active=false;
      window.removeEventListener(PROJECTS_EVENT,sync);
      window.removeEventListener("storage",sync);
    };
  },[projects]);

  const refresh = async () => {
    const next = await fetchServerProjects(projects,true);
    setItems(next.filter((p)=>p.status==="trash"));
    return next;
  };

  const restore=async(project:Project)=>{
    if(busyId)return;
    setBusyId(project.id);
    try{
      const restored={...project,status:"draft" as const,deletedAt:undefined,updatedAt:new Date().toISOString()};
      await saveProjectToServer(restored);
      await refresh();
      showAdminToast("프로젝트가 복원되었습니다.","success");
    }catch(error){
      showAdminToast(error instanceof Error?error.message:"프로젝트 복원에 실패했습니다.","error");
    }finally{
      setBusyId("");
    }
  };

  const destroy=async(project:Project)=>{
    if(busyId)return;
    if(!window.confirm(`"${project.title}" 프로젝트를 영구 삭제할까요?\n\n프로젝트 데이터와 이 프로젝트가 사용하던 R2 이미지를 함께 삭제하며 복원할 수 없습니다.`))return;
    setBusyId(project.id);
    try{
      const result=await deleteProjectPermanentlyFromServer(project.id);

      // 서버 영구 삭제가 성공한 뒤에만 로컬 캐시에서도 제거한다.
      const cached=readStoredProjects(projects).filter((p)=>p.id!==project.id);
      cacheStoredProjects(cached);
      setItems((prev)=>prev.filter((p)=>p.id!==project.id));

      if(result.r2CleanupOk){
        showAdminToast("프로젝트와 R2 이미지가 영구 삭제되었습니다.","success");
      }else{
        showAdminToast(`프로젝트는 삭제됐지만 R2 정리가 완료되지 않았습니다: ${result.r2CleanupError}`,"error");
      }
    }catch(error){
      showAdminToast(error instanceof Error?error.message:"프로젝트 영구 삭제에 실패했습니다.","error");
    }finally{
      setBusyId("");
    }
  };

  return <><h1>휴지통</h1><p>삭제한 프로젝트를 복원하거나 영구 삭제할 수 있습니다. 영구 삭제 시 해당 프로젝트의 R2 이미지도 함께 정리됩니다.</p><div className="admin-table">{items.length===0&&<div className="admin-empty">휴지통이 비어 있습니다.</div>}{items.map((project)=><div className="admin-row" key={project.id}><strong>{project.title}</strong><span>{project.deletedAt?new Date(project.deletedAt).toLocaleString("ko-KR"):"-"}</span><button type="button" disabled={busyId===project.id} onClick={()=>void restore(project)}>{busyId===project.id?"처리 중...":"복원"}</button><button type="button" disabled={busyId===project.id} onClick={()=>void destroy(project)}>{busyId===project.id?"처리 중...":"영구 삭제"}</button></div>)}</div></>;
}
