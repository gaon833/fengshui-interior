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
  // 예전 데이터만 json.height / 실제 콘텐츠 끝값을 fallback으로 사용한다.
  const pageHeight=Number(page.height||0);
  const jsonHeight=Number((page.json as any)?.height||0);
  const contentBottom=jsonContentBottom(page.json);
  const height=Math.max(1,Math.round(pageHeight>0?pageHeight:Math.max(jsonHeight,contentBottom,1)));
  return {width,height};
}

function CanvasViewer({page,index}:{page:FabricPage;index:number}){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const hostRef=useRef<HTMLDivElement|null>(null);
  const runtimeRef=useRef<any>(null);
  const scaleRef=useRef(0);
  const [scale,setScale]=useState(0);
  const size=useMemo(()=>effectiveSize(page),[page.width,page.height,page.json]);

  // Measure only the available public-page width. The Fabric object coordinates
  // remain in the saved editor coordinate system (for example 1420 x 3250).
  useEffect(()=>{
    const host=hostRef.current;
    if(!host)return;
    const update=()=>{
      const hostWidth=Math.max(1,host.clientWidth||host.getBoundingClientRect().width||1);
      const next=Math.min(1,hostWidth/size.width);
      scaleRef.current=next;
      setScale(prev=>Math.abs(prev-next)<0.0001?prev:next);
    };
    update();
    const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(update):null;
    ro?.observe(host);
    window.addEventListener("resize",update,{passive:true});
    return()=>{ro?.disconnect();window.removeEventListener("resize",update)};
  },[size.width]);

  // Create/load the Fabric canvas in source coordinates. Do not use CSS transform
  // on the canvas or a parent stage; Fabric's viewport transform is the single
  // scaling mechanism used by the public viewer.
  useEffect(()=>{
    let dead=false;
    let canvas:any;
    void (async()=>{
      const {StaticCanvas}=await import("fabric");
      if(dead||!canvasRef.current)return;
      canvas=new StaticCanvas(canvasRef.current,{
        width:size.width,
        height:size.height,
        backgroundColor:"#fff",
        renderOnAddRemove:false,
        enableRetinaScaling:false,
      });
      runtimeRef.current=canvas;
      await canvas.loadFromJSON(page.json||{objects:[]});
      if(dead){canvas?.dispose?.();return;}
      // The initial ResizeObserver can run before Fabric finishes loading.
      // Always read the latest measured scale from a ref here, otherwise the
      // async loader may accidentally apply the stale initial scale (1.0) and
      // show the 1420px source canvas enlarged on the public page.
      const currentScale=Math.max(0.0001,scaleRef.current||Math.min(1,(hostRef.current?.clientWidth||size.width)/size.width));
      const displayWidth=Math.max(1,Math.round(size.width*currentScale));
      const displayHeight=Math.max(1,Math.round(size.height*currentScale));
      canvas.setDimensions({width:displayWidth,height:displayHeight});
      canvas.setViewportTransform([currentScale,0,0,currentScale,0,0]);
      canvas.calcOffset?.();
      canvas.requestRenderAll();
    })();
    return()=>{
      dead=true;
      if(runtimeRef.current===canvas)runtimeRef.current=null;
      canvas?.dispose?.();
    };
  },[page.id,page.json,size.width,size.height]);

  // Resize/zoom an already loaded Fabric canvas. This avoids rebuilding objects
  // on every ResizeObserver callback and preserves the exact editor geometry.
  useEffect(()=>{
    scaleRef.current=scale;
    const canvas=runtimeRef.current;
    if(!canvas||scale<=0)return;
    const displayWidth=Math.max(1,Math.round(size.width*scale));
    const displayHeight=Math.max(1,Math.round(size.height*scale));
    canvas.setDimensions({width:displayWidth,height:displayHeight});
    canvas.setViewportTransform([scale,0,0,scale,0,0]);
    canvas.calcOffset?.();
    canvas.requestRenderAll();
  },[scale,size.width,size.height]);

  const displayHeight=scale>0?Math.round(size.height*scale):0;
  return <div
    ref={hostRef}
    className="fabric-public-page"
    style={displayHeight>0?{height:`${displayHeight}px`}:undefined}
    data-page-width={size.width}
    data-page-height={size.height}
    data-page-scale={scale||undefined}
  >
    <canvas ref={canvasRef} aria-label={`${index+1} page`}/>
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
