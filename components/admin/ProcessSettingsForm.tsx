"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { defaultProcessContent, imageFileToDataUrl, PROCESS_CONTENT_KEY, readLocalContent, saveLocalContent, type ProcessContent } from "@/lib/page-content";
import { showAdminToast } from "@/lib/admin-toast";
import { IMAGE_GUIDES, guideText, confirmImageRatio } from "@/lib/image-guidelines";

export default function ProcessSettingsForm() {
  const [form, setForm] = useState<ProcessContent>(defaultProcessContent);
  useEffect(() => setForm(readLocalContent(PROCESS_CONTENT_KEY, defaultProcessContent)), []);
  const upload = async (event: ChangeEvent<HTMLInputElement>) => { const file=event.target.files?.[0]; if(!file)return; try { if (!(await confirmImageRatio(file, IMAGE_GUIDES.process))) { event.target.value = ""; return; } const image = await imageFileToDataUrl(file); setForm((v)=>({...v,image})); showAdminToast("대표 이미지가 업로드되었습니다. 저장 버튼을 눌러 적용하세요.","success"); } catch(error){showAdminToast(error instanceof Error?error.message:"이미지 업로드에 실패했습니다.","error");} };
  const save = (event: FormEvent) => { event.preventDefault(); saveLocalContent(PROCESS_CONTENT_KEY, form); showAdminToast("PROCESS가 저장되었습니다.", "success"); };
  const updateStep = (index:number,key:"title"|"description",value:string)=>setForm((current)=>({...current,steps:current.steps.map((step,i)=>i===index?{...step,[key]:value}:step)}));
  const addStep=()=>setForm((current)=>({...current,steps:[...current.steps,{id:`step-${Date.now()}`,title:"새 단계",description:""}]}));
  const removeStep=(index:number)=>{if(!window.confirm("이 단계를 삭제할까요?"))return;setForm((current)=>({...current,steps:current.steps.filter((_,i)=>i!==index)}));showAdminToast("진행 단계가 삭제되었습니다. 저장 버튼을 눌러 적용하세요.","success");};
  const move=(index:number,direction:-1|1)=>setForm((current)=>{const next=[...current.steps];const target=index+direction;if(target<0||target>=next.length)return current;[next[index],next[target]]=[next[target],next[index]];return{...current,steps:next};});
  const reset=()=>{if(!window.confirm("PROCESS 내용을 기본값으로 복원할까요?"))return;localStorage.removeItem(PROCESS_CONTENT_KEY);setForm(defaultProcessContent);showAdminToast("PROCESS가 기본값으로 복원되었습니다.","success");};
  return <form onSubmit={save}>
    <div className="admin-heading"><div><h1>PROCESS 관리</h1><p>상담과 시공 진행 단계를 관리합니다.</p></div><button type="submit" className="admin-primary-button">저장</button></div>
    <div className="editor-grid">
      <section className="editor-panel"><h2>페이지 기본 정보</h2>
        <label>페이지 제목<input value={form.pageTitle} onChange={(e)=>setForm({...form,pageTitle:e.target.value})}/></label>
        <label>소개 문구<textarea value={form.introduction} onChange={(e)=>setForm({...form,introduction:e.target.value})}/></label>
        <label>대표 이미지 <span className="admin-image-guide">{guideText(IMAGE_GUIDES.process)}</span><input value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} placeholder="/images/service-cover.jpg"/><input type="file" accept="image/*" onChange={upload}/>{form.image ? <span className="admin-upload-preview"><img src={form.image} alt="PROCESS 대표 이미지 미리보기" /></span> : null}</label>
      </section>
      <section className="editor-panel"><h2>진행 단계</h2>
        {form.steps.map((step,index)=><div className="admin-process-step" key={step.id}><div className="admin-step-actions"><strong>{index+1}단계</strong><button type="button" onClick={()=>move(index,-1)}>↑</button><button type="button" onClick={()=>move(index,1)}>↓</button><button type="button" onClick={()=>removeStep(index)}>삭제</button></div><label>제목<input value={step.title} onChange={(e)=>updateStep(index,"title",e.target.value)}/></label><label>설명<textarea value={step.description} onChange={(e)=>updateStep(index,"description",e.target.value)}/></label></div>)}
        <button type="button" onClick={addStep}>단계 추가</button>
      </section>
    </div>
    <div className="admin-form-actions"><button type="submit">저장</button><button type="button" onClick={reset}>기본값 복원</button></div>
  </form>;
}
