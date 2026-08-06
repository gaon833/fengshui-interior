import type { FreeformBlock } from "@/lib/page-content";
export default function FreeformPage({blocks,label}:{blocks:FreeformBlock[];label:string}){
 if(!blocks?.length)return null;
 return <section className="freeform-public" aria-label={label}>
  {blocks.map(b=><div key={b.id} className={`freeform-public-block freeform-${b.type}`} style={{
   ["--dx" as any]:`${b.layouts.desktop.x}%`,["--dy" as any]:`${b.layouts.desktop.y}%`,["--dw" as any]:`${b.layouts.desktop.w}%`,["--dh" as any]:`${b.layouts.desktop.h}%`,
   ["--mx" as any]:`${b.layouts.mobile.x}%`,["--my" as any]:`${b.layouts.mobile.y}%`,["--mw" as any]:`${b.layouts.mobile.w}%`,["--mh" as any]:`${b.layouts.mobile.h}%`,
   zIndex:b.layouts.desktop.z
  }}>
   {b.type==="image"&&b.src?<img src={b.src} alt={b.alt||""} loading="lazy" decoding="async" style={{objectFit:b.fit||"cover"}}/>:null}
   {b.type==="text"?<div style={{fontSize:`clamp(14px, ${Math.max(14,(b.fontSize||28)*0.055)}vw, ${b.fontSize||28}px)`,textAlign:b.align||"left",color:b.color||"#3d2b20",whiteSpace:"pre-wrap"}}>{b.text}</div>:null}
  </div>)}
 </section>
}