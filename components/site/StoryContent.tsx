"use client";
import { useEffect, useState } from "react";
import { defaultStoryContent, fetchPageContent, PAGE_CONTENT_EVENT, readLocalContent, savePageContent, STORY_CONTENT_KEY } from "@/lib/page-content";
import { useAdminDeleteMode } from "@/lib/admin-delete-mode";
import { AdminDeleteButton, AdminDeleteChrome, confirmVisualDelete } from "@/components/admin-delete/AdminDeleteChrome";
export default function StoryContent(){
 const [content,setContent]=useState(defaultStoryContent); const deleteMode=useAdminDeleteMode();
 useEffect(()=>{const sync=()=>setContent(readLocalContent(STORY_CONTENT_KEY,defaultStoryContent));sync();void fetchPageContent("story",STORY_CONTENT_KEY,defaultStoryContent).then(setContent);window.addEventListener(PAGE_CONTENT_EVENT,sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener(PAGE_CONTENT_EVENT,sync);window.removeEventListener("storage",sync);};},[]);
 const remove=()=>{if(!confirmVisualDelete("OUR STORY 이미지를 삭제하시겠습니까?"))return; const next={...content,image:""};void savePageContent("story",STORY_CONTENT_KEY,next).then(setContent);};
 return <>{deleteMode.active&&<AdminDeleteChrome label="OUR STORY 이미지 삭제"/>}<section className="simple-page simple-page--story"><h1>{content.pageTitle}</h1><p>{content.introduction}</p>{content.image&&<div className="admin-delete-image-wrap"><img className="simple-page-image" src={content.image} alt={content.pageTitle} loading="lazy" decoding="async"/>{deleteMode.active&&<AdminDeleteButton label="OUR STORY 이미지 삭제" onDelete={remove}/>}</div>}<div className="simple-page-section"><h2>{content.philosophyTitle}</h2><p>{content.philosophyBody}</p></div></section></>;
}
