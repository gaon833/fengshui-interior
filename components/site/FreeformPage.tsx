import type React from "react";
import type { FreeformBlock, FreeformLayout } from "@/lib/page-content";
type Mode="desktop"|"mobile";
function layoutOf(block:FreeformBlock,mode:Mode):FreeformLayout{
  return block.layouts?.[mode] || {x:5,y:5,w:90,h:25,z:1,page:0};
}
function pageOf(layout:FreeformLayout){return Number.isFinite(layout.page) ? Math.max(0,layout.page||0) : 0}
export default function FreeformPage({blocks,label}:{blocks:FreeformBlock[];label:string}){
 if(!blocks?.length)return null;
 const pageCount=Math.max(1,...blocks.flatMap(b=>[pageOf(layoutOf(b,"desktop"))+1,pageOf(layoutOf(b,"mobile"))+1]));
 return <section className="freeform-public" aria-label={label}>
  {Array.from({length:pageCount},(_,page)=><section key={page} className="freeform-public-page">
   {blocks.map(b=>{
    const d=layoutOf(b,"desktop"),m=layoutOf(b,"mobile");
    const visibleDesktop=pageOf(d)===page, visibleMobile=pageOf(m)===page;
    if(!visibleDesktop&&!visibleMobile)return null;
    return <div key={b.id} className={`freeform-public-block freeform-${b.type} ${visibleDesktop?"show-desktop":""} ${visibleMobile?"show-mobile":""}`} style={{
      ["--dx" as string]:`${d.x}%`,["--dy" as string]:`${d.y}%`,["--dw" as string]:`${d.w}%`,["--dh" as string]:`${d.h}%`,
      ["--mx" as string]:`${m.x}%`,["--my" as string]:`${m.y}%`,["--mw" as string]:`${m.w}%`,["--mh" as string]:`${m.h}%`,
      zIndex:d.z
    } as React.CSSProperties}>
     {b.type==="image"&&b.src?<img src={b.src} alt={b.alt||""} loading={page===0?"eager":"lazy"} decoding="async" style={{objectFit:b.fit||"cover"}}/>:null}
     {b.type==="text"?<div style={{fontSize:`clamp(14px, ${Math.max(14,(b.fontSize||28)*0.055)}vw, ${b.fontSize||28}px)`,textAlign:b.align||"left",color:b.color||"#3d2b20",whiteSpace:"pre-wrap"}}>{b.text}</div>:null}
     {b.type==="rect"?<div className="freeform-shape-rect" style={{border:`${b.strokeWidth||1}px solid ${b.strokeColor||"#666"}`,background:b.fillColor||"transparent",opacity:b.opacity??1,borderRadius:`${b.radius||0}px`}}/>:null}
     {b.type==="hline"?<div className="freeform-shape-line is-horizontal" style={{background:b.strokeColor||"#666",height:`${b.strokeWidth||1}px`,opacity:b.opacity??1}}/>:null}
     {b.type==="vline"?<div className="freeform-shape-line is-vertical" style={{background:b.strokeColor||"#666",width:`${b.strokeWidth||1}px`,opacity:b.opacity??1}}/>:null}
    </div>
   })}
  </section>)}
 </section>
}