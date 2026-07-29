"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { addGalleryItems, GALLERY_EVENT, readGalleryItems, type GalleryAnalysis, type GalleryItem } from "@/lib/gallery-store";
import { optimizeImageFile } from "@/lib/image-optimizer";
import { showAdminToast } from "@/lib/admin-toast";

const MAX_BATCH = 10;
const ANALYSIS_CONCURRENCY = 2;
const AUTO_RETRY_COUNT = 2;

const SPACE_TAGS = ["거실","주방","욕실","침실","다이닝","현관","복도","드레스룸","서재","세탁실","베란다","외관","기타"];
const STRUCTURE_TAGS = ["거실+주방","주방+다이닝","거실+다이닝","오픈형","대면형","독립형","ㄱ자형","ㄷ자형","아일랜드형"];
const STYLE_TAGS = ["모던","미니멀","내추럴","클래식","빈티지","호텔식","재팬디","북유럽","인더스트리얼","럭셔리"];
const COLOR_TAGS = ["화이트","아이보리","베이지","브라운","블랙","그레이","크림","우드톤"];
const MATERIAL_TAGS = ["원목","우드","대리석","타일","유리","금속","세라믹","스톤","패브릭","템바보드"];
const FEATURE_TAGS = ["간접조명","라인조명","아일랜드","무몰딩","대형창","수납장","붙박이장","샤워부스","욕조","세면대","소파","TV","팬던트조명"];

type UploadStatus = "queued" | "optimizing" | "analyzing" | "ready" | "warning" | "failed" | "saved";
type UploadTask = { id:string; fileName:string; src:string; status:UploadStatus; analysis:GalleryAnalysis|null; error?:string };
type TagField = "space" | "styles" | "colors" | "materials" | "features" | "keywords";

function list(value?: string[]) { return Array.isArray(value) ? [...new Set(value.map(String).map((v)=>v.trim()).filter(Boolean))] : []; }
function normalizeAnalysis(value: Partial<GalleryAnalysis>): GalleryAnalysis {
  return { caption:String(value.caption || "인테리어 공간 이미지"), space:list(value.space).slice(0,1), styles:list(value.styles), colors:list(value.colors), materials:list(value.materials), features:list(value.features), keywords:list(value.keywords), model:value.model, analyzedAt:new Date().toISOString() };
}
function fallbackAnalysis(fileName:string):GalleryAnalysis { const clean=fileName.replace(/[_-]+/g," ").trim(); return normalizeAnalysis({caption:clean?`${clean} 인테리어 이미지`:"인테리어 공간 이미지",keywords:clean?clean.split(/\s+/).slice(0,8):["인테리어"]}); }
function statusText(status:UploadStatus){return ({queued:"대기",optimizing:"이미지 최적화 중",analyzing:"AI 태그 추천 중",ready:"태그 확인 가능",warning:"사진 저장 가능",failed:"처리 실패",saved:"저장 완료"} as const)[status];}
async function runPool<T>(items:T[],limit:number,worker:(item:T,index:number)=>Promise<void>){let cursor=0;async function runner(){while(cursor<items.length){const index=cursor++;await worker(items[index],index);}}await Promise.all(Array.from({length:Math.min(limit,items.length)},()=>runner()));}
function toggle(values:string[],value:string){return values.includes(value)?values.filter((item)=>item!==value):[...values,value];}

function TagGroup({title,values,selected,onToggle,single=false}:{title:string;values:string[];selected:string[];onToggle:(value:string)=>void;single?:boolean}){
  return <div className="admin-tag-group"><strong>{title}</strong><div className="admin-tag-chips">{values.map((value)=><button type="button" key={value} className={selected.includes(value)?"is-selected":""} aria-pressed={selected.includes(value)} onClick={()=>onToggle(value)}>{value}</button>)}</div>{single&&<small>대표 공간은 1개만 선택됩니다.</small>}</div>;
}

export default function GalleryManager(){
  const [items,setItems]=useState<GalleryItem[]>([]); const [tasks,setTasks]=useState<UploadTask[]>([]); const [processing,setProcessing]=useState(false); const [activeId,setActiveId]=useState<string>(""); const [aiStatus,setAiStatus]=useState<"checking"|"ready"|"error">("checking");
  const sync=()=>setItems(readGalleryItems());
  useEffect(()=>{sync();window.addEventListener(GALLERY_EVENT,sync);void fetch("/api/gallery/analyze",{cache:"no-store"}).then(async(r)=>{const p=await r.json() as {ok?:boolean;aiBound?:boolean;dbBound?:boolean};setAiStatus(r.ok&&p.ok&&p.aiBound&&p.dbBound?"ready":"error");}).catch(()=>setAiStatus("error"));return()=>window.removeEventListener(GALLERY_EVENT,sync);},[]);
  const saveableCount=tasks.filter((task)=>task.status==="ready"||task.status==="warning").length;
  const activeTask=useMemo(()=>tasks.find((task)=>task.id===activeId)||tasks[0]||null,[tasks,activeId]);
  const patchTask=(id:string,patch:Partial<UploadTask>)=>setTasks((current)=>current.map((task)=>task.id===id?{...task,...patch}:task));
  const patchAnalysis=(id:string,field:TagField,value:string,single=false)=>setTasks((current)=>current.map((task)=>{if(task.id!==id||!task.analysis)return task;const currentValues=list(task.analysis[field]);const nextValues=single?(currentValues.includes(value)?[]:[value]):toggle(currentValues,value);return {...task,analysis:{...task.analysis,[field]:nextValues}};}));
  const applyToAll=(source:UploadTask)=>{if(!source.analysis)return;setTasks((current)=>current.map((task)=>task.analysis?{...task,analysis:{...task.analysis,space:[...source.analysis!.space],styles:[...source.analysis!.styles],colors:[...source.analysis!.colors],materials:[...source.analysis!.materials],features:[...source.analysis!.features]}}:task));showAdminToast("선택한 태그를 모든 사진에 적용했습니다.");};

  const analyzeTask=async(task:UploadTask)=>{
    patchTask(task.id,{status:"analyzing",error:undefined}); let lastError="";
    for(let attempt=0;attempt<AUTO_RETRY_COUNT;attempt++){
      try{const response=await fetch("/api/gallery/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({image:task.src,galleryId:task.id})});const payload=await response.json() as {ok?:boolean;analysis?:Partial<GalleryAnalysis>;model?:string;error?:string;storedInD1?:boolean};if(!response.ok||!payload.ok||!payload.analysis||!payload.storedInD1)throw new Error(payload.error||"AI 태그 추천을 완료하지 못했습니다.");patchTask(task.id,{analysis:normalizeAnalysis({...payload.analysis,model:payload.model}),status:"ready",error:undefined});return;}catch(error){lastError=error instanceof Error?error.message:"AI 분석이 지연되었습니다.";if(attempt+1<AUTO_RETRY_COUNT)await new Promise((resolve)=>setTimeout(resolve,800));}
    }
    patchTask(task.id,{analysis:fallbackAnalysis(task.fileName),status:"warning",error:lastError});
  };

  const onFiles=async(files?:FileList|null)=>{const selected=Array.from(files||[]);if(!selected.length)return;if(selected.length>MAX_BATCH){showAdminToast(`한 번에 최대 ${MAX_BATCH}장까지 업로드할 수 있습니다.`,"error");return;}const nextTasks:UploadTask[]=selected.map((file)=>({id:crypto.randomUUID(),fileName:file.name.replace(/\.[^.]+$/,"") ,src:"",status:"queued",analysis:null}));setTasks(nextTasks);setActiveId(nextTasks[0]?.id||"");setProcessing(true);try{await runPool(selected.map((file,index)=>({file,task:nextTasks[index]})),ANALYSIS_CONCURRENCY,async({file,task})=>{patchTask(task.id,{status:"optimizing"});try{const optimized=await optimizeImageFile(file,{maxWidth:1600,maxHeight:2400,quality:.84});if(items.some((item)=>item.src===optimized)){patchTask(task.id,{status:"failed",error:"이미 등록된 동일한 이미지입니다."});return;}const readyTask={...task,src:optimized,status:"analyzing" as const};patchTask(task.id,{src:optimized,status:"analyzing"});await analyzeTask(readyTask);}catch(error){patchTask(task.id,{status:"failed",error:error instanceof Error?error.message:"이미지를 처리하지 못했습니다."});}});showAdminToast(`${selected.length}장의 태그 추천이 끝났습니다.`);}finally{setProcessing(false);}};

  const persistFinalAnalysis=async(task:UploadTask)=>{if(!task.analysis)return;const response=await fetch("/api/gallery/analyze",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({galleryId:task.id,analysis:task.analysis})});if(!response.ok)throw new Error("확정 태그를 D1에 저장하지 못했습니다.");};
  const saveAll=async()=>{const targets=tasks.filter((task)=>(task.status==="ready"||task.status==="warning")&&task.src&&task.analysis);if(!targets.length)return showAdminToast("저장할 사진이 없습니다.","error");const missing=targets.filter((task)=>!task.analysis?.space.length);if(missing.length)return showAdminToast("모든 사진에서 대표 공간 태그를 1개씩 선택해 주세요.","error");setProcessing(true);try{await runPool(targets,ANALYSIS_CONCURRENCY,async(task)=>persistFinalAnalysis(task));addGalleryItems(targets.map((task)=>{const analysis=task.analysis!;const tags=[...analysis.space,...analysis.styles,...analysis.colors,...analysis.materials,...analysis.features];const keywords=[...new Set([...analysis.keywords,...tags])];const finalized={...analysis,keywords,analyzedAt:new Date().toISOString()};return {id:task.id,src:task.src,title:analysis.caption||`${task.fileName} 갤러리 이미지`,searchText:[task.fileName,...tags,...keywords].filter(Boolean).join(" "),analysis:finalized};}));setTasks([]);setActiveId("");showAdminToast(`${targets.length}장이 저장되었습니다.`);}catch(error){showAdminToast(error instanceof Error?error.message:"저장하지 못했습니다.","error");}finally{setProcessing(false);}};

  return <div className="admin-stack"><section className="admin-card admin-form"><div className="admin-heading"><div><h1>GALLERY 관리</h1></div><a className="admin-filter-button" href="/gallery/?adminDelete=1&returnTo=%2Fadmin%2Fgallery">이미지 삭제</a></div><p>사진을 최대 10장 선택하면 AI가 태그를 추천합니다. 틀린 태그만 클릭해서 수정한 뒤 저장하세요.</p><div className={`admin-ai-connection ${aiStatus}`} role="status">{aiStatus==="checking"?"AI · D1 연결 확인 중…":aiStatus==="ready"?"Workers AI · D1 연결 정상":"Workers AI 또는 D1 연결을 확인해 주세요"}</div><label>이미지 <small>최대 10장 · 각 원본 30MB 이하 · 원본 비율 유지</small><input type="file" accept="image/*" multiple disabled={processing} onChange={(event)=>void onFiles(event.target.files)}/></label>

  {tasks.length>0&&<><div className="admin-gallery-batch is-horizontal-order" aria-live="polite">{tasks.map((task,index)=><button type="button" className={`admin-gallery-batch-item is-${task.status} ${activeTask?.id===task.id?"is-active":""}`} key={task.id} onClick={()=>setActiveId(task.id)}><div className="admin-gallery-batch-index">{index+1}</div><div className="admin-gallery-batch-image">{task.src?<Image src={task.src} alt={task.fileName} width={300} height={360} unoptimized/>:<span>{task.status==="optimizing"?"최적화 중":"대기"}</span>}</div><div className="admin-gallery-batch-meta"><strong>{task.fileName}</strong><span>{statusText(task.status)}</span>{task.error&&<small className="admin-gallery-batch-warning">자동 추천 없이 직접 태그를 선택해 저장할 수 있습니다.</small>}</div></button>)}</div>
  {activeTask?.analysis&&<div className="admin-tag-editor"><header><div><strong>{activeTask.fileName}</strong><span>AI 추천 태그를 확인하고 수정하세요.</span></div>{tasks.length>1&&<button type="button" className="admin-secondary-button" onClick={()=>applyToAll(activeTask)}>이 태그를 전체 적용</button>}</header><TagGroup title="공간" values={SPACE_TAGS} selected={activeTask.analysis.space} single onToggle={(value)=>patchAnalysis(activeTask.id,"space",value,true)}/><TagGroup title="구조" values={STRUCTURE_TAGS} selected={activeTask.analysis.keywords} onToggle={(value)=>patchAnalysis(activeTask.id,"keywords",value)}/><TagGroup title="스타일" values={STYLE_TAGS} selected={activeTask.analysis.styles} onToggle={(value)=>patchAnalysis(activeTask.id,"styles",value)}/><TagGroup title="색상" values={COLOR_TAGS} selected={activeTask.analysis.colors} onToggle={(value)=>patchAnalysis(activeTask.id,"colors",value)}/><TagGroup title="소재" values={MATERIAL_TAGS} selected={activeTask.analysis.materials} onToggle={(value)=>patchAnalysis(activeTask.id,"materials",value)}/><TagGroup title="특징" values={FEATURE_TAGS} selected={activeTask.analysis.features} onToggle={(value)=>patchAnalysis(activeTask.id,"features",value)}/></div>}</>}
  <button type="button" className="admin-primary-button" disabled={processing||saveableCount===0} onClick={()=>void saveAll()}>{processing?"처리 중…":saveableCount?`${saveableCount}장 저장`:"사진 저장"}</button></section>
  <section className="admin-card"><h2>등록된 GALLERY</h2>{items.length===0?<p>추가한 이미지가 없습니다.</p>:<div className="admin-gallery-list">{items.map((item)=><article key={item.id}><Image src={item.src} alt={item.title} width={220} height={280} unoptimized/><div><strong>{item.analysis?.space[0]||"GALLERY 이미지"}</strong>{item.analysis&&<small>{[...item.analysis.styles,...item.analysis.colors].slice(0,3).join(" · ")}</small>}<a href="/gallery/?adminDelete=1&returnTo=%2Fadmin%2Fgallery">이미지 삭제</a></div></article>)}</div>}</section></div>;
}
