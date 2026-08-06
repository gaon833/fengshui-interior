"use client";
import { useEffect, useState, type FormEvent } from "react";
import { defaultProcessContent, fetchPageContent, readLocalContent, savePageContent, PROCESS_CONTENT_KEY, type ProcessContent } from "@/lib/page-content";
import { emptyVisualDocument } from "@/lib/visual-editor";
import VisualPageEditor from "@/components/editor/VisualPageEditor";
import { showAdminToast } from "@/lib/admin-toast";
export default function ProcessSettingsForm(){
 const [form,setForm]=useState<ProcessContent>({...defaultProcessContent,visual:emptyVisualDocument()});
 useEffect(()=>{const local=readLocalContent(PROCESS_CONTENT_KEY,defaultProcessContent);setForm({...local,visual:local.visual||emptyVisualDocument()});void fetchPageContent("process",PROCESS_CONTENT_KEY,defaultProcessContent,true).then(v=>setForm({...v,visual:v.visual||emptyVisualDocument()}))},[]);
 const save=async(e:FormEvent)=>{e.preventDefault();try{const stored=await savePageContent("process",PROCESS_CONTENT_KEY,form);setForm(stored);showAdminToast("PROCESS 디자인이 D1/R2에 저장되었습니다.","success")}catch(error){showAdminToast(error instanceof Error?error.message:"저장 실패","error")}};
 return <form onSubmit={save}><VisualPageEditor label="PROCESS" value={form.visual||emptyVisualDocument()} onChange={visual=>setForm((v:ProcessContent)=>({...v,visual}))}/><div className="admin-form-actions lite-save"><button type="submit">저장 및 홈페이지 적용</button></div></form>
}
