"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { defaultStoryContent, fetchPageContent, readLocalContent, savePageContent, STORY_CONTENT_KEY, type PolotnoDesign, type StoryContent } from "@/lib/page-content";
import { showAdminToast } from "@/lib/admin-toast";
import PolotnoDesignerClient from "@/components/polotno/PolotnoDesignerClient";
export default function StorySettingsForm(){
 const [form,setForm]=useState<StoryContent>(defaultStoryContent);
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{const local=readLocalContent(STORY_CONTENT_KEY,defaultStoryContent);setForm(local);void fetchPageContent("story",STORY_CONTENT_KEY,defaultStoryContent,true).then(value=>{setForm(value);setLoaded(true)}).catch(()=>setLoaded(true))},[]);
 const setDesktop=useCallback((polotnoDesktop:PolotnoDesign)=>setForm(c=>({...c,polotnoDesktop})),[]);
 const setMobile=useCallback((polotnoMobile:PolotnoDesign)=>setForm(c=>({...c,polotnoMobile})),[]);
 const save=async(e:FormEvent)=>{e.preventDefault();try{const stored=await savePageContent("story",STORY_CONTENT_KEY,form);setForm(stored);showAdminToast("OUR STORY Polotno 디자인이 D1/R2에 저장되었습니다.","success")}catch(error){showAdminToast(error instanceof Error?error.message:"저장 실패","error")}};
 return <form onSubmit={save}>{loaded?<PolotnoDesignerClient desktop={form.polotnoDesktop||null} mobile={form.polotnoMobile||null} onDesktopChange={setDesktop} onMobileChange={setMobile} pageLabel="OUR STORY"/>:<div className="polotno-loading">저장된 디자인을 불러오는 중...</div>}<div className="admin-form-actions"><button type="submit">저장 및 홈페이지 적용</button></div></form>;
}
