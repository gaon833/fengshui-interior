"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FabricDocument, FabricPage, FabricResponsiveDocument } from "@/lib/page-content";

type Props={document:FabricResponsiveDocument;label:string};

function jsonContentBottom(json:any){
  const objects=Array.isArray(json?.objects)?json.objects:[];
  let maxBottom=0;
  const walk=(obj:any,parentTop=0,parentScaleY=1)=>{
    if(!obj||typeof obj!=="object")return;
    const top=parentTop+Number(obj.top||0)*parentScaleY;
    const scaleY=parentScaleY*Number(obj.scaleY??1);
    const height=Math.abs(Number(obj.height||0)*scaleY);
    maxBottom=Math.max(maxBottom,top+height);
    const children=obj.objects||obj._objects;
    if(Array.isArray(children))children.forEach((child:any)=>walk(child,top,scaleY));
  };
  objects.forEach((obj:any)=>walk(obj));
  return maxBottom;
}

function effectiveSize(page:FabricPage){
  const width=Math.max(1,Number(page.width||(page.json as any)?.width||1420));
  const savedHeight=Math.max(1,Number(page.height||0),Number((page.json as any)?.height||0));
  const contentBottom=jsonContentBottom(page.json);
  const height=Math.max(savedHeight,contentBottom>savedHeight?Math.ceil(contentBottom):0,1);
  return {width,height};
}

function CanvasViewer({page,index}:{page:FabricPage;index:number}){
  const ref=useRef<HTMLCanvasElement|null>(null);
  const size=useMemo(()=>effectiveSize(page),[page.width,page.height,page.json]);
  useEffect(()=>{
    let dead=false;let c:any;
    void (async()=>{
      const {StaticCanvas}=await import("fabric");
      if(dead||!ref.current)return;
      c=new StaticCanvas(ref.current,{width:size.width,height:size.height,backgroundColor:"#fff",renderOnAddRemove:false});
      await c.loadFromJSON(page.json||{objects:[]});
      c.setDimensions({width:size.width,height:size.height});
      c.requestRenderAll();
      const el=c.lowerCanvasEl;
      el.style.width="100%";
      el.style.height="auto";
      el.style.display="block";
    })();
    return()=>{dead=true;c?.dispose?.()};
  },[page.id,size.width,size.height,page.json]);
  return <div className="fabric-public-page" style={{aspectRatio:`${size.width}/${size.height}`}}><canvas ref={ref} aria-label={`${index+1} page`}/></div>;
}
function Doc({doc}:{doc:FabricDocument}){return <>{doc.pages.map((p,i)=><CanvasViewer page={p} index={i} key={p.id}/>)}</>}
export default function FabricDocumentViewer({document,label}:Props){
  const [mobile,setMobile]=useState(false);
  useEffect(()=>{const f=()=>setMobile(innerWidth<=768);f();addEventListener("resize",f);return()=>removeEventListener("resize",f)},[]);
  const preferred=mobile?document.mobile:document.desktop;
  const fallback=mobile?document.desktop:document.mobile;
  const hasObjects=(d:FabricDocument)=>d.pages?.some(p=>Array.isArray((p.json as any)?.objects)&&((p.json as any).objects.length>0));
  const doc=hasObjects(preferred)?preferred:fallback;
  return <section className="fabric-public-document" aria-label={label}><Doc doc={doc}/></section>;
}
