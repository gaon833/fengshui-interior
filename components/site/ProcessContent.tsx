"use client";
import VisualPageRenderer from "@/components/editor/VisualPageRenderer";
import { useEffect, useState } from "react";
import { defaultProcessContent, fetchPageContent, PAGE_CONTENT_EVENT, PROCESS_CONTENT_KEY, readLocalContent, savePageContent } from "@/lib/page-content";
import { useAdminDeleteMode } from "@/lib/admin-delete-mode";
import { AdminDeleteButton, AdminDeleteChrome, confirmVisualDelete } from "@/components/admin-delete/AdminDeleteChrome";
export default function ProcessContent(){
 const [content,setContent]=useState(defaultProcessContent); const deleteMode=useAdminDeleteMode();
 useEffect(()=>{const sync=()=>setContent(readLocalContent(PROCESS_CONTENT_KEY,defaultProcessContent));sync();void fetchPageContent("process",PROCESS_CONTENT_KEY,defaultProcessContent).then(setContent);window.addEventListener(PAGE_CONTENT_EVENT,sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener(PAGE_CONTENT_EVENT,sync);window.removeEventListener("storage",sync);};},[]);
 const remove=()=>{if(!confirmVisualDelete("PROCESS 이미지를 삭제하시겠습니까?"))return;const next={...content,image:""};void savePageContent("process",PROCESS_CONTENT_KEY,next).then(setContent);};
 if (content.visual?.pages?.length) return <VisualPageRenderer document={content.visual} label="PROCESS" />;
  return <>{deleteMode.active&&<AdminDeleteChrome label="PROCESS 이미지 삭제"/>}<section className="simple-page"><h1>{content.pageTitle}</h1><p>{content.introduction}</p>{content.image&&<div className="admin-delete-image-wrap"><img className="simple-page-image" src={content.image} alt={content.pageTitle} loading="lazy" decoding="async"/>{deleteMode.active&&<AdminDeleteButton label="PROCESS 이미지 삭제" onDelete={remove}/>}</div>}<div className="process-public-list">{content.steps.map((step,index)=><article key={step.id}><span>{String(index+1).padStart(2,"0")}</span><div><h2>{step.title}</h2><p>{step.description}</p></div></article>)}</div></section></>;
}
