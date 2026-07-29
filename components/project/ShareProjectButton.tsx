"use client";
import { useState } from "react";
import { trackEngagement } from "@/lib/engagement";
export default function ShareProjectButton({slug,title}:{slug:string;title:string}){
 const [message,setMessage]=useState("");
 const share=async()=>{
  const url=`${window.location.origin}/project/view/?slug=${encodeURIComponent(slug)}`;
  try{
   const canUseNativeShare = typeof navigator.share === "function";
   if(canUseNativeShare) await navigator.share({title,text:`${title} | 풍수 인테리어`,url});
   else await navigator.clipboard.writeText(url);
   trackEngagement({type:"share",projectSlug:slug,projectTitle:title,target:"project"});
   setMessage(canUseNativeShare?"공유되었습니다.":"링크가 복사되었습니다.");
  }catch(error){ if((error as Error).name!=="AbortError") setMessage("공유하지 못했습니다."); }
  window.setTimeout(()=>setMessage(""),1700);
 };
 return <><button type="button" className="project-share-button" onClick={share}>SHARE</button>{message&&<div className="scrap-feedback" role="status">{message}</div>}</>;
}
