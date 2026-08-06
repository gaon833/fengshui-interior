"use client";
import { useEffect, useState, type FormEvent } from "react";
import { defaultStoryContent, fetchPageContent, readLocalContent, savePageContent, STORY_CONTENT_KEY, type StoryContent } from "@/lib/page-content";
import { emptyVisualDocument } from "@/lib/visual-editor";
import VisualPageEditor from "@/components/editor/VisualPageEditor";
import { showAdminToast } from "@/lib/admin-toast";
export default function StorySettingsForm(){
 const [form,setForm]=useState<StoryContent>({...defaultStoryContent,visual:emptyVisualDocument()});
 useEffect(()=>{const local=readLocalContent(STORY_CONTENT_KEY,defaultStoryContent);setForm({...local,visual:local.visual||emptyVisualDocument()});void fetchPageContent("story",STORY_CONTENT_KEY,defaultStoryContent,true).then(v=>setForm({...v,visual:v.visual||emptyVisualDocument()}))},[]);
 const save=async(e:FormEvent)=>{e.preventDefault();try{const stored=await savePageContent("story",STORY_CONTENT_KEY,form);setForm(stored);showAdminToast("OUR STORY 디자인이 D1/R2에 저장되었습니다.","success")}catch(error){showAdminToast(error instanceof Error?error.message:"저장 실패","error")}};
 return <form onSubmit={save}><VisualPageEditor label="OUR STORY" value={form.visual||emptyVisualDocument()} onChange={visual=>setForm((v:StoryContent)=>({...v,visual}))}/><div className="admin-form-actions lite-save"><button type="submit">저장 및 홈페이지 적용</button></div></form>
}
