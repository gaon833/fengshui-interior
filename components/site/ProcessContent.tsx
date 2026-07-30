"use client";
import { useEffect, useState } from "react";
import { defaultProcessContent, PAGE_CONTENT_EVENT, PROCESS_CONTENT_KEY, readLocalContent, saveLocalContent } from "@/lib/page-content";
import { useAdminDeleteMode } from "@/lib/admin-delete-mode";
import dynamic from "next/dynamic";
import { confirmVisualDelete } from "@/lib/confirm-visual-delete";
const AdminDeleteChrome = dynamic(() => import("@/components/admin-delete/AdminDeleteChrome").then((mod) => mod.AdminDeleteChrome));
const AdminDeleteButton = dynamic(() => import("@/components/admin-delete/AdminDeleteChrome").then((mod) => mod.AdminDeleteButton));
export default function ProcessContent(){
 const [content,setContent]=useState(defaultProcessContent); const deleteMode=useAdminDeleteMode();
 useEffect(()=>{const sync=()=>setContent(readLocalContent(PROCESS_CONTENT_KEY,defaultProcessContent));sync();window.addEventListener(PAGE_CONTENT_EVENT,sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener(PAGE_CONTENT_EVENT,sync);window.removeEventListener("storage",sync);};},[]);
 const remove=()=>{if(!confirmVisualDelete("PROCESS 이미지를 삭제하시겠습니까?"))return;const next={...content,image:""};saveLocalContent(PROCESS_CONTENT_KEY,next);setContent(next);};
 return <>{deleteMode.active&&<AdminDeleteChrome label="PROCESS 이미지 삭제"/>}<section className="simple-page"><h1>{content.pageTitle}</h1><p>{content.introduction}</p>{content.image&&<div className="admin-delete-image-wrap"><img className="simple-page-image" src={content.image} alt={content.pageTitle} loading="lazy" decoding="async"/>{deleteMode.active&&<AdminDeleteButton label="PROCESS 이미지 삭제" onDelete={remove}/>}</div>}<div className="process-public-list">{content.steps.map((step,index)=><article key={step.id}><span>{String(index+1).padStart(2,"0")}</span><div><h2>{step.title}</h2><p>{step.description}</p></div></article>)}</div></section></>;
}
