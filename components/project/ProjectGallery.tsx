"use client";

import Image from "next/image";
import type { ProjectImage } from "@/types/project";
import ScrapButton from "./ScrapButton";
import ShareIconButton from "./ShareIconButton";
import { readStoredProjects, saveStoredProjects } from "@/lib/project-store";
import { useAdminDeleteMode } from "@/lib/admin-delete-mode";
import dynamic from "next/dynamic";
import { confirmVisualDelete } from "@/lib/confirm-visual-delete";
const AdminDeleteButton = dynamic(() => import("@/components/admin-delete/AdminDeleteChrome").then((mod) => mod.AdminDeleteButton));

export default function ProjectGallery({images,projectSlug,projectTitle}:{images:ProjectImage[];projectSlug:string;projectTitle:string}){
 const deleteMode=useAdminDeleteMode();
 const remove=(image:ProjectImage,index:number)=>{
  if(!confirmVisualDelete("이 프로젝트 상세 이미지를 삭제하시겠습니까?"))return;
  const current=readStoredProjects([]);
  if(!current.length)return;
  const next=current.map((project)=>project.slug===projectSlug?{...project,images:project.images.filter((item,itemIndex)=>(image.id?item.id!==image.id:itemIndex!==index)).map((item,order)=>({...item,order:order+1})),updatedAt:new Date().toISOString()}:project);
  saveStoredProjects(next);
 };
 return <>{images.map((image,index)=><figure className={`detail-photo ${image.orientation === "portrait" ? "portrait" : "landscape"}`} key={`${image.src}-${index}`}>
  <div className="detail-photo-inner">
   <Image src={image.src} alt={image.alt || `프로젝트 상세 이미지 ${index + 1}`} width={image.orientation === "portrait" ? 900 : 1600} height={image.orientation === "portrait" ? 1300 : 1050} loading="lazy" fetchPriority="low" decoding="async" quality={80} unoptimized={image.src.startsWith("data:")} sizes="(max-width:900px) calc(100vw - 36px), 70vw"/>
   {deleteMode.active?<AdminDeleteButton label={`${projectTitle} 상세 이미지 삭제`} onDelete={()=>remove(image,index)}/>:<><ScrapButton className="detail-image-heart" item={{id:`image:${projectSlug}:${image.id || index}`,kind:"image",projectSlug,projectTitle,src:image.src,alt:image.alt || `${projectTitle} 상세 이미지 ${index+1}`}} /><ShareIconButton className="detail-image-share" projectSlug={projectSlug} projectTitle={projectTitle} /></>}
  </div>
 </figure>)}</>;
}
