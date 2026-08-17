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
  const width=Math.max(1,Math.round(Number(page.width||(page.json as any)?.width||1420)));
  // 관리자에서 저장한 page.height를 최우선으로 사용한다.
  // 예전 데이터 호환을 위해 json.height / 실제 콘텐츠 끝값도 fallback으로만 사용한다.
  const pageHeight=Number(page.height||0);
  const jsonHeight=Number((page.json as any)?.height||0);
  const contentBottom=jsonContentBottom(page.json);
  const height=Math.max(1,Math.round(pageHeight>0?pageHeight:Math.max(jsonHeight,contentBottom,1)));
  return {width,height};
}

function CanvasViewer({page,index}:{page:FabricPage;index:number}){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const hostRef=useRef<HTMLDivElement|null>(null);
  const [scale,setScale]=useState(0);
  const size=useMemo(()=>effectiveSize(page),[page.width,page.height,page.json]);

  // Public view must preserve the exact same geometry as the editor.
  // Render Fabric at its saved source size, then scale the WHOLE canvas.
  // This keeps every object position and the page bottom whitespace identical.
  useEffect(()=>{
    const host=hostRef.current;
    if(!host)return;
    const update=()=>{
      const hostWidth=Math.max(1,host.getBoundingClientRect().width||host.clientWidth||1);
      const next=hostWidth/size.width;
      setScale(prev=>Math.abs(prev-next)<0.0001?prev:next);
    };
    update();
    const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(update):null;
    ro?.observe(host);
    window.addEventListener("resize",update,{passive:true});
    return()=>{ro?.disconnect();window.removeEventListener("resize",update)};
  },[size.width]);

  useEffect(()=>{
    let dead=false;let canvas:any;
    void (async()=>{
      const {StaticCanvas}=await import("fabric");
      if(dead||!canvasRef.current)return;
      canvas=new StaticCanvas(canvasRef.current,{
        width:size.width,
        height:size.height,
        backgroundColor:"#fff",
        renderOnAddRemove:false,
      });
      await canvas.loadFromJSON(page.json||{objects:[]});
      if(dead){canvas?.dispose?.();return;}
      // Keep the Fabric backstore at the exact saved editor dimensions.
      // Never resize the Fabric canvas itself to the browser viewport.
      canvas.setDimensions({width:size.width,height:size.height},{cssOnly:false});
      canvas.requestRenderAll();
    })();
    return()=>{dead=true;canvas?.dispose?.()};
  },[page.id,size.width,size.height,page.json]);

  const scaledHeight=scale>0?size.height*scale:0;
  return <div
    ref={hostRef}
    className="fabric-public-page"
    style={scaledHeight>0?{height:`${scaledHeight}px`}:undefined}
    data-page-width={size.width}
    data-page-height={size.height}
    data-page-scale={scale||undefined}
  >
    <div
      className="fabric-public-page-stage"
      style={{
        width:`${size.width}px`,
        height:`${size.height}px`,
        transform:scale>0?`scale(${scale})`:"scale(0)",
        transformOrigin:"top left",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label={`${index+1} page`}
        width={size.width}
        height={size.height}
      />
    </div>
  </div>;
}

function Doc({doc}:{doc:FabricDocument}){return <>{doc.pages.map((p,i)=><CanvasViewer page={p} index={i} key={p.id}/>)}</>}

export default function FabricDocumentViewer({document,label}:Props){
  const [mobile,setMobile]=useState(false);
  useEffect(()=>{const f=()=>setMobile(window.innerWidth<=768);f();window.addEventListener("resize",f,{passive:true});return()=>window.removeEventListener("resize",f)},[]);
  const preferred=mobile?document.mobile:document.desktop;
  const fallback=mobile?document.desktop:document.mobile;
  const hasObjects=(d:FabricDocument)=>d.pages?.some(p=>Array.isArray((p.json as any)?.objects)&&((p.json as any).objects.length>0));
  const doc=hasObjects(preferred)?preferred:fallback;
  return <section className="fabric-public-document" aria-label={label}><Doc doc={doc}/></section>;
}
