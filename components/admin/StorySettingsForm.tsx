"use client";
import {useEffect,useState,type FormEvent} from "react";
import { defaultStoryContent, fetchPageContent, readLocalContent, savePageContent, STORY_CONTENT_KEY, type StoryContent } from "@/lib/page-content";
import {showAdminToast} from "@/lib/admin-toast";
import FreeformPageEditor from "@/components/admin/FreeformPageEditor";
export default function StorySettingsForm(){
 const [form,setForm]=useState<StoryContent>(defaultStoryContent);
 useEffect(()=>{const local=readLocalContent(STORY_CONTENT_KEY,defaultStoryContent);setForm(local);void fetchPageContent("story",STORY_CONTENT_KEY,defaultStoryContent,true).then(setForm)},[]);
 const save=async(e:FormEvent)=>{e.preventDefault();try{const stored=await savePageContent("story",STORY_CONTENT_KEY,form);setForm(stored);showAdminToast("OUR STORY 자유 배치가 D1/R2에 저장되었습니다.","success")}catch(error){showAdminToast(error instanceof Error?error.message:"저장 실패","error")}};
 return <form onSubmit={save}><div className="editor-grid"><section className="editor-panel"><h2>기존 콘텐츠(호환용)</h2><p className="admin-help">자유 배치 블록이 하나라도 있으면 공개 페이지에서는 자유 배치 디자인을 우선 표시합니다. 기존 내용은 삭제하지 않고 보존합니다.</p></section></div><FreeformPageEditor pageLabel="OUR STORY" blocks={form.blocks||[]} onChange={blocks=>setForm(current=>({...current,blocks}))}/><div className="admin-form-actions"><button type="submit">저장 및 홈페이지 적용</button></div></form>
}