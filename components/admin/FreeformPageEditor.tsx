"use client";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import AdminFilePicker from "@/components/admin/AdminFilePicker";
import { imageFileToDataUrl, type FreeformBlock, type FreeformLayout } from "@/lib/page-content";
import { showAdminToast } from "@/lib/admin-toast";

type Props={blocks:FreeformBlock[];onChange:(blocks:FreeformBlock[])=>void;pageLabel:string};
type Mode="desktop"|"mobile";

/* Desktop은 실제 공개 화면의 작업 영역을 기준으로 계산한다.
   전체 브라우저 폭 - 왼쪽 사이드바 400px - 오른쪽 여백 100px.
   Mobile은 390x693 기준 미리보기로 유지한다. */
const MOBILE_CANVAS={w:390,h:693};

function clamp(n:number,min:number,max:number){return Math.min(max,Math.max(min,n))}
function snap(n:number,step=2.5){return Math.round(n/step)*step}
function uid(){return `block-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function layoutOf(block:FreeformBlock,mode:Mode):FreeformLayout{
  return block.layouts?.[mode] || (mode==="mobile"
    ? {x:5,y:8,w:90,h:24,z:1,page:0}
    : {x:7,y:8,w:38,h:32,z:1,page:0});
}
function pageOf(layout:FreeformLayout){return Number.isFinite(layout.page) ? Math.max(0,layout.page||0) : 0}

export default function FreeformPageEditor({blocks,onChange,pageLabel}:Props){
 const [mode,setMode]=useState<Mode>("desktop");
 const [selected,setSelected]=useState<string|null>(blocks[0]?.id||null);
 const [viewport,setViewport]=useState({w:1920,h:1080});
 const [grid,setGrid]=useState(true);
 const canvasRefs=useRef<Record<number,HTMLDivElement|null>>({});
 useEffect(()=>{
   const sync=()=>setViewport({w:window.innerWidth,h:window.innerHeight});
   sync(); window.addEventListener("resize",sync);
   return()=>window.removeEventListener("resize",sync);
 },[]);
 const desktopCanvas={w:Math.max(320,viewport.w-500),h:Math.max(500,viewport.h)};
 const canvasSize=mode==="desktop"?desktopCanvas:MOBILE_CANVAS;
 const pageCount=useMemo(()=>Math.max(1,...blocks.flatMap(b=>[
   pageOf(layoutOf(b,"desktop"))+1,pageOf(layoutOf(b,"mobile"))+1
 ])),[blocks]);

 const update=(id:string,fn:(b:FreeformBlock)=>FreeformBlock)=>onChange(blocks.map(b=>b.id===id?fn(b):b));
 const currentPage=selected ? pageOf(layoutOf(blocks.find(b=>b.id===selected) || blocks[0],mode)) : 0;

 const addText=(page=currentPage)=>{const id=uid();onChange([...blocks,{id,type:"text",text:"새 텍스트",fontSize:32,align:"left",color:"#3d2b20",layouts:{
   desktop:{x:8,y:10,w:30,h:12,z:blocks.length+1,page},
   mobile:{x:6,y:8,w:88,h:12,z:blocks.length+1,page}
 }}]);setSelected(id)};
 const addImage=(page=currentPage)=>{const id=uid();onChange([...blocks,{id,type:"image",src:"",fit:"cover",layouts:{
   desktop:{x:50,y:10,w:42,h:50,z:blocks.length+1,page},
   mobile:{x:5,y:22,w:90,h:38,z:blocks.length+1,page}
 }}]);setSelected(id)};
 const addRect=(page=currentPage)=>{const id=uid();onChange([...blocks,{id,type:"rect",strokeColor:"#6b6b6b",strokeWidth:1,fillColor:"#ffffff",opacity:1,radius:0,layouts:{
   desktop:{x:15,y:18,w:32,h:24,z:blocks.length+1,page},
   mobile:{x:10,y:18,w:80,h:22,z:blocks.length+1,page}
 }}]);setSelected(id)};
 const addHLine=(page=currentPage)=>{const id=uid();onChange([...blocks,{id,type:"hline",strokeColor:"#6b6b6b",strokeWidth:1,opacity:1,layouts:{
   desktop:{x:12,y:48,w:44,h:2,z:blocks.length+1,page},
   mobile:{x:10,y:48,w:80,h:2,z:blocks.length+1,page}
 }}]);setSelected(id)};
 const addVLine=(page=currentPage)=>{const id=uid();onChange([...blocks,{id,type:"vline",strokeColor:"#6b6b6b",strokeWidth:1,opacity:1,layouts:{
   desktop:{x:50,y:16,w:2,h:50,z:blocks.length+1,page},
   mobile:{x:50,y:16,w:2,h:50,z:blocks.length+1,page}
 }}]);setSelected(id)};

 const addPage=()=>{
   const newPage=pageCount;
   const id=uid();
   onChange([...blocks,{id,type:"text",text:`${newPage+1} PAGE`,fontSize:18,align:"left",color:"#aaa",layouts:{
     desktop:{x:4,y:4,w:16,h:6,z:1,page:newPage},
     mobile:{x:5,y:4,w:30,h:6,z:1,page:newPage}
   }}]);
   setSelected(id);
   requestAnimationFrame(()=>canvasRefs.current[newPage]?.scrollIntoView({behavior:"smooth",block:"center"}));
 };

 const removePage=(page:number)=>{
   if(pageCount<=1){showAdminToast("마지막 페이지는 삭제할 수 없습니다.","error");return}
   if(!window.confirm(`${page+1}페이지와 그 안의 모든 요소를 삭제하시겠습니까?`))return;
   const next=blocks
    .filter(b=>pageOf(layoutOf(b,mode))!==page)
    .map(b=>{
      const layouts={...b.layouts};
      (["desktop","mobile"] as Mode[]).forEach(m=>{
        const l=layoutOf(b,m);
        if(pageOf(l)>page) layouts[m]={...l,page:pageOf(l)-1};
      });
      return {...b,layouts};
    });
   onChange(next); setSelected(null);
 };

 const remove=()=>{if(selected)onChange(blocks.filter(b=>b.id!==selected));setSelected(null)};
 const moveLayer=(delta:number)=>{if(!selected)return;update(selected,b=>{const l=layoutOf(b,mode);return {...b,layouts:{...b.layouts,[mode]:{...l,z:Math.max(1,l.z+delta)}}}})};

 const moveToPage=(page:number)=>{
   if(!selected)return;
   update(selected,b=>{
     const l=layoutOf(b,mode);
     return {...b,layouts:{...b.layouts,[mode]:{...l,page,x:clamp(l.x,0,100-l.w),y:clamp(l.y,0,100-l.h)}}};
   });
   requestAnimationFrame(()=>canvasRefs.current[page]?.scrollIntoView({behavior:"smooth",block:"center"}));
 };

 const pointer=(e:ReactPointerEvent,id:string,kind:"move"|"resize")=>{
   e.preventDefault();e.stopPropagation();setSelected(id);
   const b=blocks.find(x=>x.id===id); if(!b)return;
   const start=layoutOf(b,mode), page=pageOf(start), el=canvasRefs.current[page]; if(!el)return;
   const rect=el.getBoundingClientRect(), sx=e.clientX,sy=e.clientY;
   const target=e.currentTarget as HTMLElement; target.setPointerCapture(e.pointerId);
   const onMove=(ev:PointerEvent)=>{
     const dx=(ev.clientX-sx)/rect.width*100,dy=(ev.clientY-sy)/rect.height*100;
     update(id,cur=>{
       let next:FreeformLayout;
       if(kind==="move") next={...start,x:clamp(grid?snap(start.x+dx):start.x+dx,0,100-start.w),y:clamp(grid?snap(start.y+dy):start.y+dy,0,100-start.h)};
       else next={...start,w:clamp(grid?snap(start.w+dx):start.w+dx,4,100-start.x),h:clamp(grid?snap(start.h+dy):start.h+dy,4,100-start.y)};
       return {...cur,layouts:{...cur.layouts,[mode]:next}};
     });
   };
   const done=()=>{target.removeEventListener("pointermove",onMove);target.removeEventListener("pointerup",done);target.removeEventListener("pointercancel",done)};
   target.addEventListener("pointermove",onMove);target.addEventListener("pointerup",done);target.addEventListener("pointercancel",done);
 };

 const upload=async(id:string,file?:File)=>{if(!file)return;try{const src=await imageFileToDataUrl(file);update(id,b=>({...b,src}));showAdminToast("이미지가 추가되었습니다. 저장을 눌러 적용하세요.","success")}catch(err){showAdminToast(err instanceof Error?err.message:"이미지 처리 실패","error")}};

 const current=blocks.find(b=>b.id===selected);
 return <section className="freeform-admin">
   <div className="freeform-toolbar">
    <strong>{pageLabel} 페이지 편집</strong>
    <div className="freeform-mode"><button type="button" className={mode==="desktop"?"is-active":""} onClick={()=>setMode("desktop")}>Desktop 실제 영역</button><button type="button" className={mode==="mobile"?"is-active":""} onClick={()=>setMode("mobile")}>Mobile 9:16 ≤ 768px</button></div>
    <button type="button" onClick={()=>addText()}>+ 텍스트</button>
    <button type="button" onClick={()=>addImage()}>+ 이미지</button><button type="button" onClick={()=>addRect()}>+ 사각박스</button><button type="button" onClick={()=>addHLine()}>+ 가로선</button><button type="button" onClick={()=>addVLine()}>+ 세로선</button>
    <button type="button" className="freeform-add-page" onClick={addPage}>+ 페이지 추가</button><button type="button" className={grid?"is-active":""} onClick={()=>setGrid(v=>!v)}>그리드 {grid?"ON":"OFF"}</button>
    <button type="button" disabled={!selected} onClick={()=>moveLayer(1)}>앞으로</button>
    <button type="button" disabled={!selected} onClick={()=>moveLayer(-1)}>뒤로</button>
    <button type="button" disabled={!selected} onClick={remove}>요소 삭제</button>
   </div>
   <p className="admin-help">Desktop은 전체 화면에서 왼쪽 사이드바 400px과 오른쪽 여백 100px을 뺀 실제 콘텐츠 영역 비율로 보입니다. 아래로 스크롤하며 1페이지·2페이지·3페이지를 원페이지 사이트처럼 이어서 편집할 수 있습니다. 요소는 페이지 안에서 드래그하고, 오른쪽 아래 손잡이로 크기를 조절합니다.</p>

   <div className={`freeform-pages is-${mode} ${grid?"show-grid":""}`}><div className="freeform-vertical-grid" aria-hidden="true"/>
    {Array.from({length:pageCount},(_,page)=><section key={page} className="freeform-page-editor">
      <div className="freeform-page-head">
        <strong>{page+1} PAGE</strong>
        <span>{mode==="desktop"?`실제 영역 ${desktopCanvas.w} × ${desktopCanvas.h}`:"9:16 Mobile"}</span>
        <button type="button" onClick={()=>addText(page)}>+ 텍스트</button>
        <button type="button" onClick={()=>addImage(page)}>+ 이미지</button><button type="button" onClick={()=>addRect(page)}>+ 박스</button><button type="button" onClick={()=>addHLine(page)}>+ 가로선</button><button type="button" onClick={()=>addVLine(page)}>+ 세로선</button>
        {pageCount>1?<button type="button" onClick={()=>removePage(page)}>페이지 삭제</button>:null}
      </div>
      <div className="freeform-canvas-shell">
       <div ref={node=>{canvasRefs.current[page]=node}} className="freeform-canvas" style={{aspectRatio:`${canvasSize.w}/${canvasSize.h}`}}><div className="freeform-horizontal-grid" aria-hidden="true"/>
        {blocks.filter(b=>pageOf(layoutOf(b,mode))===page).map(b=>{const l=layoutOf(b,mode);return <div key={b.id} className={`freeform-edit-block ${selected===b.id?"is-selected":""}`} style={{left:`${l.x}%`,top:`${l.y}%`,width:`${l.w}%`,height:`${l.h}%`,zIndex:l.z}} onPointerDown={e=>pointer(e,b.id,"move")}>
          {b.type==="image"?(b.src?<img src={b.src} alt="" draggable={false} style={{objectFit:b.fit||"cover"}}/>:<span className="freeform-empty">이미지를 선택하세요</span>)
          :b.type==="text"?<div className="freeform-edit-text" style={{fontSize:`${b.fontSize||28}px`,textAlign:b.align||"left",color:b.color||"#333"}}>{b.text||"텍스트"}</div>
          :b.type==="rect"?<div className="freeform-shape-rect" style={{border:`${b.strokeWidth||1}px solid ${b.strokeColor||"#666"}`,background:b.fillColor||"transparent",opacity:b.opacity??1,borderRadius:`${b.radius||0}px`}}/>
          :b.type==="hline"?<div className="freeform-shape-line is-horizontal" style={{background:b.strokeColor||"#666",height:`${b.strokeWidth||1}px`,opacity:b.opacity??1}}/>
          :<div className="freeform-shape-line is-vertical" style={{background:b.strokeColor||"#666",width:`${b.strokeWidth||1}px`,opacity:b.opacity??1}}/>}
          <button type="button" aria-label="크기 조절" className="freeform-resize" onPointerDown={e=>pointer(e,b.id,"resize")}/>
        </div>})}
       </div>
      </div>
    </section>)}
   </div>

   {current?<div className="freeform-inspector"><h3>선택 요소 설정</h3>
     <label>페이지<select value={pageOf(layoutOf(current,mode))} onChange={e=>moveToPage(Number(e.target.value))}>{Array.from({length:pageCount},(_,i)=><option key={i} value={i}>{i+1} PAGE</option>)}</select></label>
     {current.type==="text"?<>
       <label>텍스트<textarea value={current.text||""} onChange={e=>update(current.id,b=>({...b,text:e.target.value}))}/></label>
       <label>글자 크기(px)<input type="number" min="10" max="140" value={current.fontSize||28} onChange={e=>update(current.id,b=>({...b,fontSize:Number(e.target.value)||28}))}/></label>
       <label>정렬<select value={current.align||"left"} onChange={e=>update(current.id,b=>({...b,align:e.target.value as "left"|"center"|"right"}))}><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option></select></label>
       <label>글자색<input type="color" value={current.color||"#3d2b20"} onChange={e=>update(current.id,b=>({...b,color:e.target.value}))}/></label>
     </>:current.type==="image"?<>
       <AdminFilePicker onChange={e=>void upload(current.id,e.target.files?.[0])} help="개별 이미지를 선택하세요. 기존 WebP 최적화를 그대로 사용합니다."/>
       <label>이미지 맞춤<select value={current.fit||"cover"} onChange={e=>update(current.id,b=>({...b,fit:e.target.value as "cover"|"contain"}))}><option value="cover">영역 채우기</option><option value="contain">전체 보이기</option></select></label>
     </>:<>
       <label>선 색상<input type="color" value={current.strokeColor||"#6b6b6b"} onChange={e=>update(current.id,b=>({...b,strokeColor:e.target.value}))}/></label>
       <label>선 굵기(px)<input type="number" min="1" max="30" value={current.strokeWidth||1} onChange={e=>update(current.id,b=>({...b,strokeWidth:Number(e.target.value)||1}))}/></label>
       <label>투명도<input type="range" min="0" max="1" step="0.05" value={current.opacity??1} onChange={e=>update(current.id,b=>({...b,opacity:Number(e.target.value)}))}/></label>
       {current.type==="rect"?<>
         <label>배경색<input type="color" value={current.fillColor||"#ffffff"} onChange={e=>update(current.id,b=>({...b,fillColor:e.target.value}))}/></label>
         <label>모서리 둥글기(px)<input type="number" min="0" max="100" value={current.radius||0} onChange={e=>update(current.id,b=>({...b,radius:Number(e.target.value)||0}))}/></label>
       </>:null}
     </>}
   </div>:null}
 </section>
}
