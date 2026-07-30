"use client";
import { useRef, type ChangeEvent } from "react";
import projects from "@/content/projects.json";
import { PROJECTS_STORAGE_KEY, readStoredProjects, saveStoredProjects } from "@/lib/project-store";
import { SITE_SETTINGS_EVENT, SITE_SETTINGS_KEY } from "@/lib/site-settings";
import { PROCESS_CONTENT_KEY, STORY_CONTENT_KEY, PAGE_CONTENT_EVENT } from "@/lib/page-content";
import { showAdminToast } from "@/lib/admin-toast";

type BackupData={version:string;createdAt:string;siteSettings:string|null;story:string|null;process:string|null;projects:unknown};
export default function BackupManager(){
 const input=useRef<HTMLInputElement|null>(null);
 const download=()=>{const data:BackupData={version:"4.6.0",createdAt:new Date().toISOString(),siteSettings:localStorage.getItem(SITE_SETTINGS_KEY),story:localStorage.getItem(STORY_CONTENT_KEY),process:localStorage.getItem(PROCESS_CONTENT_KEY),projects:readStoredProjects(projects as any)};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`fengshui-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);showAdminToast("백업 파일이 저장되었습니다.","success");};
 const restore=async(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file)return;if(!window.confirm("선택한 백업으로 현재 관리자 데이터를 복원할까요?")){event.target.value="";return;}try{const data=JSON.parse(await file.text()) as BackupData;if(data.siteSettings)localStorage.setItem(SITE_SETTINGS_KEY,data.siteSettings);else localStorage.removeItem(SITE_SETTINGS_KEY);if(data.story)localStorage.setItem(STORY_CONTENT_KEY,data.story);else localStorage.removeItem(STORY_CONTENT_KEY);if(data.process)localStorage.setItem(PROCESS_CONTENT_KEY,data.process);else localStorage.removeItem(PROCESS_CONTENT_KEY);if(Array.isArray(data.projects))saveStoredProjects(data.projects as any);else localStorage.removeItem(PROJECTS_STORAGE_KEY);window.dispatchEvent(new Event(SITE_SETTINGS_EVENT));window.dispatchEvent(new Event(PAGE_CONTENT_EVENT));showAdminToast("백업이 복원되었습니다.","success");}catch{showAdminToast("올바른 백업 파일이 아닙니다.","error");}finally{event.target.value="";}};
 return <><div className="admin-heading"><div><h1>백업과 복원</h1><p>현재 브라우저의 사이트 설정과 프로젝트 데이터를 파일로 보관합니다.</p></div><button className="admin-primary-button" type="button" onClick={download}>새 백업 만들기</button></div><section className="editor-panel"><h2>백업 파일 복원</h2><p className="admin-note">복원하면 현재 브라우저에 저장된 내용이 백업 파일의 내용으로 교체됩니다.</p><label className="admin-file-picker" onClick={()=>input.current?.click()}><span className="admin-file-picker-icon" aria-hidden="true">↥</span><strong>백업 파일 선택</strong><small>클릭하여 JSON 백업 파일을 선택하세요</small><input ref={input} type="file" accept="application/json,.json" onChange={restore}/></label></section></>;
}
