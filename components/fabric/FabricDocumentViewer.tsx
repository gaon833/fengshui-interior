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
  const [rendered,setRendered]=useState({width:0,height:0});
  const size=useMemo(()=>effectiveSize(page),[page.width,page.height,page.json]);

  // 실제 홈페이지의 가로폭을 기준으로 저장된 페이지 비율을 px 높이로 확정한다.
  // aspect-ratio / height:auto에 의존하지 않아 관리자 하단 여백이 그대로 보인다.
  useEffect(()=>{
    const host=hostRef.current;
    if(!host)return;
    const update=()=>{
      const width=Math.max(1,host.clientWidth||host.getBoundingClientRect().width||1);
      const height=Math.max(1,width*(size.height/size.width));
      setRendered(prev=>Math.abs(prev.width-width)<.5&&Math.abs(prev.height-height)<.5?prev:{width,height});
    };
    update();
    const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(update):null;
    ro?.observe(host);
    window.addEventListener("resize",update,{passive:true});
    return()=>{ro?.disconnect();window.removeEventListener("resize",update)};
  },[size.width,size.height]);

  useEffect(()=>{
    let dead=false;let canvas:any;
    void (async()=>{
      const {StaticCanvas}=await import("fabric");
      if(dead||!canvasRef.current)return;
      canvas=new StaticCanvas(canvasRef.current,{width:size.width,height:size.height,backgroundColor:"#fff",renderOnAddRemove:false});
      await canvas.loadFromJSON(page.json||{objects:[]});
      if(dead){canvas?.dispose?.();return;}
      // Fabric 내부 backstore 크기도 저장된 page.height와 정확히 일치시킨다.
      canvas.setDimensions({width:size.width,height:size.height});
      canvas.requestRenderAll();
    })();
    return()=>{dead=true;canvas?.dispose?.()};
  },[page.id,size.width,size.height,page.json]);

  const styleHeight=rendered.height>0?`${rendered.height}px`:undefined;
  return <div ref={hostRef} className="fabric-public-page" style={{height:styleHeight,minHeight:styleHeight}} data-page-width={size.width} data-page-height={size.height}>
    <canvas
      ref={canvasRef}
      aria-label={`${index+1} page`}
      style={rendered.width>0?{width:`${rendered.width}px`,height:`${rendered.height}px`,display:"block"}:undefined}
    />
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
