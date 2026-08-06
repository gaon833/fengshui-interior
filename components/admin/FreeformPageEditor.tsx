"use client";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import AdminFilePicker from "@/components/admin/AdminFilePicker";
import { imageFileToDataUrl, type FreeformBlock, type FreeformLayout } from "@/lib/page-content";
import { showAdminToast } from "@/lib/admin-toast";

type Props={blocks:FreeformBlock[];onChange:(blocks:FreeformBlock[])=>void;pageLabel:string};
type Mode="desktop"|"mobile";
const CANVAS={desktop:{w:1200,h:760},mobile:{w:390,h:760}};

function clamp(n:number,min:number,max:number){return Math.min(max,Math.max(min,n))}
function layoutOf(block:FreeformBlock,mode:Mode):FreeformLayout{
  return block.layouts?.[mode] || (mode==="mobile"
    ? {x:5,y:5,w:90,h:25,z:block.layouts?.desktop?.z||1}
    : {x:5,y:5,w:35,h:25,z:1});
}
function uid(){return `block-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}

export default function FreeformPageEditor({blocks,onChange,pageLabel}:Props){
 const [mode,setMode]=useState<Mode>("desktop"); const [selected,setSelected]=useState<string|null>(blocks[0]?.id||null);
 const canvas=useRef<HTMLDivElement>(null);
 const update=(id:string,fn:(b:FreeformBlock)=>FreeformBlock)=>onChange(blocks.map(b=>b.id===id?fn(b):b));
 const addText=()=>{const id=uid();onChange([...blocks,{id,type:"text",text:"새 텍스트",fontSize:32,align:"left",color:"#3d2b20",layouts:{desktop:{x:8,y:8,w:30,h:12,z:blocks.length+1},mobile:{x:6,y:6,w:88,h:12,z:blocks.length+1}}}]);setSelected(id)};
 const addImage=()=>{const id=uid();onChange([...blocks,{id,type:"image",src:"",fit:"cover",layouts:{desktop:{x:45,y:8,w:48,h:42,z:blocks.length+1},mobile:{x:5,y:20,w:90,h:32,z:blocks.length+1}}}]);setSelected(id)};
 const remove=()=>{if(selected)onChange(blocks.filter(b=>b.id!==selected));setSelected(null)};
 const moveLayer=(delta:number)=>{if(!selected)return;update(selected,b=>{const l=layoutOf(b,mode);return {...b,layouts:{...b.layouts,[mode]:{...l,z:Math.max(1,l.z+delta)}}}})};
 const pointer=(e:ReactPointerEvent,id:string,kind:"move"|"resize")=>{
   e.preventDefault();e.stopPropagation();setSelected(id); const el=canvas.current;if(!el)return;
   const b=blocks.find(x=>x.id===id);if(!b)return; const start=layoutOf(b,mode), rect=el.getBoundingClientRect(), sx=e.clientX,sy=e.clientY;
   const target=e.currentTarget as HTMLElement; target.setPointerCapture(e.pointerId);
   const onMove=(ev:PointerEvent)=>{const dx=(ev.clientX-sx)/rect.width*100,dy=(ev.clientY-sy)/rect.height*100;
     update(id,cur=>{const base=layoutOf(cur,mode);let next:FreeformLayout;
       if(kind==="move"){next={...start,x:clamp(start.x+dx,0,100-start.w),y:clamp(start.y+dy,0,100-start.h)}}
       else{next={...start,w:clamp(start.w+dx,4,100-start.x),h:clamp(start.h+dy,4,100-start.y)}}
       return {...cur,layouts:{...cur.layouts,[mode]:next}}});
   };
   const done=()=>{target.removeEventListener("pointermove",onMove);target.removeEventListener("pointerup",done);target.removeEventListener("pointercancel",done)};
   target.addEventListener("pointermove",onMove);target.addEventListener("pointerup",done);target.addEventListener("pointercancel",done);
 };
 const upload=async(id:string,file?:File)=>{if(!file)return;try{const src=await imageFileToDataUrl(file);update(id,b=>({...b,src}));showAdminToast("이미지가 추가되었습니다. 저장을 눌러 적용하세요.","success")}catch(err){showAdminToast(err instanceof Error?err.message:"이미지 처리 실패","error")}};
 const current=blocks.find(b=>b.id===selected);
 return <section className="freeform-admin">
   <div className="freeform-toolbar">
    <strong>{pageLabel} 자유 배치</strong>
    <div className="freeform-mode"><button type="button" className={mode==="desktop"?"is-active":""} onClick={()=>setMode("desktop")}>Desktop</button><button type="button" className={mode==="mobile"?"is-active":""} onClick={()=>setMode("mobile")}>Mobile ≤ 768px</button></div>
    <button type="button" onClick={addText}>+ 텍스트</button><button type="button" onClick={addImage}>+ 이미지</button>
    <button type="button" disabled={!selected} onClick={()=>moveLayer(1)}>앞으로</button><button type="button" disabled={!selected} onClick={()=>moveLayer(-1)}>뒤로</button>
    <button type="button" disabled={!selected} onClick={remove}>삭제</button>
   </div>
   <p className="admin-help">요소를 드래그해 이동하고 오른쪽 아래 손잡이로 크기를 조절합니다. Desktop/Mobile 위치는 따로 저장됩니다. 콘텐츠는 한 번만 등록합니다.</p>
   <div className={`freeform-canvas-shell is-${mode}`}>
    <div ref={canvas} className="freeform-canvas" style={{aspectRatio:`${CANVAS[mode].w}/${CANVAS[mode].h}`}}>
     {blocks.map(b=>{const l=layoutOf(b,mode);return <div key={b.id} className={`freeform-edit-block ${selected===b.id?"is-selected":""}`} style={{left:`${l.x}%`,top:`${l.y}%`,width:`${l.w}%`,height:`${l.h}%`,zIndex:l.z}} onPointerDown={e=>pointer(e,b.id,"move")}>
       {b.type==="image"?(b.src?<img src={b.src} alt="" draggable={false} style={{objectFit:b.fit||"cover"}}/>:<span className="freeform-empty">이미지를 선택하세요</span>):<div className="freeform-edit-text" style={{fontSize:`${b.fontSize||28}px`,textAlign:b.align||"left",color:b.color||"#333"}}>{b.text||"텍스트"}</div>}
       <button type="button" aria-label="크기 조절" className="freeform-resize" onPointerDown={e=>pointer(e,b.id,"resize")}/>
     </div>})}
    </div>
   </div>
   {current?<div className="freeform-inspector"><h3>선택 요소 설정</h3>
     {current.type==="text"?<>
       <label>텍스트<textarea value={current.text||""} onChange={e=>update(current.id,b=>({...b,text:e.target.value}))}/></label>
       <label>글자 크기(px)<input type="number" min="10" max="120" value={current.fontSize||28} onChange={e=>update(current.id,b=>({...b,fontSize:Number(e.target.value)||28}))}/></label>
       <label>정렬<select value={current.align||"left"} onChange={e=>update(current.id,b=>({...b,align:e.target.value as any}))}><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option></select></label>
       <label>글자색<input type="color" value={current.color||"#3d2b20"} onChange={e=>update(current.id,b=>({...b,color:e.target.value}))}/></label>
     </>:<>
       <AdminFilePicker onChange={e=>void upload(current.id,e.target.files?.[0])} help="개별 이미지를 선택하세요. 기존 WebP 최적화를 사용합니다."/>
       <label>이미지 맞춤<select value={current.fit||"cover"} onChange={e=>update(current.id,b=>({...b,fit:e.target.value as any}))}><option value="cover">영역 채우기</option><option value="contain">전체 보이기</option></select></label>
     </>}
   </div>:null}
 </section>
}
