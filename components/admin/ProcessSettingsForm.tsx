"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { defaultProcessContent, fetchPageContent, PROCESS_CONTENT_KEY, readLocalContent, savePageContent, type PolotnoDesign, type ProcessContent } from "@/lib/page-content";
import { showAdminToast } from "@/lib/admin-toast";
import PolotnoDesignerClient from "@/components/polotno/PolotnoDesignerClient";
export default function ProcessSettingsForm(){
 const [form,setForm]=useState<ProcessContent>(defaultProcessContent);
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{const local=readLocalContent(PROCESS_CONTENT_KEY,defaultProcessContent);setForm(local);void fetchPageContent("process",PROCESS_CONTENT_KEY,defaultProcessContent,true).then(value=>{setForm(value);setLoaded(true)}).catch(()=>setLoaded(true))},[]);
 const setDesktop=useCallback((polotnoDesktop:PolotnoDesign)=>setForm(c=>({...c,polotnoDesktop})),[]);
 const setMobile=useCallback((polotnoMobile:PolotnoDesign)=>setForm(c=>({...c,polotnoMobile})),[]);
 const save=async(e:FormEvent)=>{e.preventDefault();try{const stored=await savePageContent("process",PROCESS_CONTENT_KEY,form);setForm(stored);showAdminToast("PROCESS Polotno 디자인이 D1/R2에 저장되었습니다.","success")}catch(error){showAdminToast(error instanceof Error?error.message:"저장 실패","error")}};
 return <form onSubmit={save}>{loaded?<PolotnoDesignerClient desktop={form.polotnoDesktop||null} mobile={form.polotnoMobile||null} onDesktopChange={setDesktop} onMobileChange={setMobile} pageLabel="PROCESS"/>:<div className="polotno-loading">저장된 디자인을 불러오는 중...</div>}<div className="admin-form-actions"><button type="submit">저장 및 홈페이지 적용</button></div></form>;
}
