"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { imageFileToDataUrl, type FabricDocument, type FabricPage, type FabricResponsiveDocument } from "@/lib/page-content";
import { showAdminToast } from "@/lib/admin-toast";

type Mode = "desktop" | "mobile";
type BrushType = "pencil" | "spray" | "circle";
type FabricRuntime = { canvas: any; fabric: any };
type Inspector = { pageId:string; object:any } | null;
type GuideState = { x:number[]; y:number[]; distances?:{left:number;right:number;top:number;bottom:number} };
type DrawSettings = { enabled:boolean; type:BrushType; color:string; width:number };

type Props = { value?: FabricResponsiveDocument; onChange:(value:FabricResponsiveDocument)=>void; pageLabel:string };
const EMPTY_JSON = { version:"7.0.0", objects:[] };
const BLUE = "#28aaf7";
const GRID = 20;

function uid(prefix="page"){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
const COMMON_PAGE_SIZE:Record<Mode,{width:number;height:number}> = {
  desktop:{width:1420,height:900},
  mobile:{width:390,height:844},
};
function pageSize(mode:Mode){return COMMON_PAGE_SIZE[mode]}
function scaleFabricJson(json:any,sx:number,sy:number){
  const next=cloneJson(json||EMPTY_JSON);
  const scaleObject=(obj:any)=>{
    if(!obj||typeof obj!=="object")return;
    if(typeof obj.left==="number")obj.left*=sx;
    if(typeof obj.top==="number")obj.top*=sy;
    if(typeof obj.scaleX==="number")obj.scaleX*=sx; else obj.scaleX=sx;
    if(typeof obj.scaleY==="number")obj.scaleY*=sy; else obj.scaleY=sy;
    const children=obj.objects||obj._objects;
    if(Array.isArray(children))children.forEach(scaleObject);
  };
  (next.objects||[]).forEach(scaleObject);
  return next;
}
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
function normalizePage(page:FabricPage,mode:Mode):FabricPage{
  const target=pageSize(mode);
  const oldW=Math.max(1,Number(page.width||target.width));
  const widthScale=target.width/oldW;
  const persistedHeight=Math.max(
    target.height,
    Number(page.height||0),
    Number((page.json as any)?.height||0),
    jsonContentBottom(page.json)>0?Math.ceil(jsonContentBottom(page.json)):0,
  );
  const newH=Math.max(target.height,Math.ceil(persistedHeight*widthScale));
  if(oldW===target.width&&Number(page.height||0)===newH)return page;
  return {...page,width:target.width,height:newH,json:scaleFabricJson(page.json,widthScale,widthScale)};
}
function blankPage(mode:Mode):FabricPage{const size=pageSize(mode);return{id:uid(),...size,json:structuredClone(EMPTY_JSON)}}
function ensureDoc(doc:FabricDocument|undefined,mode:Mode):FabricDocument{
  return doc?.pages?.length?{...doc,pages:doc.pages.map(p=>normalizePage(p,mode))}:{version:1,pages:[blankPage(mode)]};
}
function cloneJson<T>(value:T):T{return JSON.parse(JSON.stringify(value))}
function getKind(obj:any){return obj?.data?.kind || (obj?.type==="i-text"?"text":obj?.type==="image"?"image":obj?.type||"object")}
const LAYER_NAMES:Record<string,string>={text:"텍스트",image:"이미지",rect:"사각형",circle:"원",ellipse:"타원",triangle:"삼각형",star:"별",hline:"가로선",vline:"세로선",drawing:"드로잉",svg:"SVG",group:"그룹"};
function ensureLayerMeta(obj:any,index=0){
  if(!obj)return obj;
  const data={...(obj.data||{})};
  if(!data.layerId)data.layerId=uid("layer");
  if(!data.layerName)data.layerName=`${LAYER_NAMES[getKind(obj)]||getKind(obj)} ${index+1}`;
  obj.set?.("data",data);
  const children=obj.getObjects?.()||obj._objects||[];
  children.forEach((child:any,i:number)=>ensureLayerMeta(child,i));
  return obj;
}
function renewLayerMeta(obj:any,index=0){
  if(!obj)return obj;
  const data={...(obj.data||{}),layerId:uid("layer")};
  if(!data.layerName)data.layerName=`${LAYER_NAMES[getKind(obj)]||getKind(obj)} ${index+1}`;
  obj.set?.("data",data);
  const children=obj.getObjects?.()||obj._objects||[];
  children.forEach((child:any,i:number)=>renewLayerMeta(child,i));
  return obj;
}
function styleObject(obj:any){
  ensureLayerMeta(obj);
  obj.set({
    borderColor:BLUE,cornerColor:"#fff",cornerStrokeColor:BLUE,cornerStyle:"rect",
    cornerSize:10,transparentCorners:false,padding:0,
    selectable:true,evented:true,hasControls:true,hasBorders:true,
    lockMovementX:false,lockMovementY:false,
  });
  // Respect explicitly persisted lock state only.
  if(obj?.data?.locked)obj.set({lockMovementX:true,lockMovementY:true,lockScalingX:true,lockScalingY:true,lockRotation:true,hasControls:false});
  obj.setCoords?.();return obj
}
function objectName(obj:any,index=0){return obj?.data?.layerName || `${LAYER_NAMES[getKind(obj)]||getKind(obj)} ${index+1}`}

function CanvasPage({page,grid,zoom,draw,onReady,onChange,onSelect,onThumb,minPageHeight}:{page:FabricPage;grid:boolean;zoom:number;draw:DrawSettings;onReady:(id:string,r:FabricRuntime|null)=>void;onChange:(id:string,json:any)=>void;onSelect:(inspector:Inspector)=>void;onThumb:(id:string,url:string)=>void;minPageHeight:number}){
 const canvasRef=useRef<HTMLCanvasElement|null>(null); const hostRef=useRef<HTMLDivElement|null>(null); const runtime=useRef<FabricRuntime|null>(null); const [fit,setFit]=useState(1); const [guide,setGuide]=useState<GuideState|null>(null); const [displayHeight,setDisplayHeight]=useState(page.height); const [isResizing,setIsResizing]=useState(false); const dragHeightRef=useRef(page.height); const loading=useRef(true); const lastJson=useRef(JSON.stringify(page.json||EMPTY_JSON)); const selectedLayerId=useRef<string|null>(null); const resizing=useRef(false);
 useEffect(()=>{const host=hostRef.current;if(!host)return;const update=()=>setFit(Math.min(1,Math.max(.18,host.clientWidth/page.width)));update();const ro=new ResizeObserver(update);ro.observe(host);return()=>ro.disconnect()},[page.width]);
 useEffect(()=>{let dead=false; let canvas:any=null;
   (async()=>{const fabric=await import("fabric");if(dead||!canvasRef.current)return;canvas=new fabric.Canvas(canvasRef.current,{width:page.width,height:page.height,preserveObjectStacking:true,selection:true,backgroundColor:"#fff"});runtime.current={canvas,fabric};onReady(page.id,runtime.current);loading.current=true;await canvas.loadFromJSON(page.json||EMPTY_JSON);canvas.getObjects().forEach((o:any,i:number)=>{ensureLayerMeta(o,i);styleObject(o)});canvas.requestRenderAll();loading.current=false;
     const snapshot=()=>{if(loading.current)return;const bounds=canvas.getObjects().filter((o:any)=>!o.excludeFromExport).map((o:any)=>o.getBoundingRect());const maxBottom=bounds.length?Math.max(...bounds.map((b:any)=>b.top+b.height)):0;if(maxBottom>canvas.getHeight()){canvas.setHeight(Math.ceil(maxBottom+20));}canvas.getObjects().forEach((o:any,i:number)=>ensureLayerMeta(o,i));const json=canvas.toObject(["data"]);const raw=JSON.stringify(json);lastJson.current=raw;onChange(page.id,{...json,width:canvas.getWidth(),height:canvas.getHeight()});requestAnimationFrame(()=>{try{onThumb(page.id,canvas.toDataURL({format:"jpeg",quality:.55,multiplier:.12}))}catch{}})};
     const select=()=>{const obj=canvas.getActiveObject();selectedLayerId.current=obj?.data?.layerId||null;onSelect(obj?{pageId:page.id,object:obj}:null)};
     const snapMove=(event:any)=>{const obj=event.target;if(!obj)return;let left=Number(obj.left||0),top=Number(obj.top||0);if(grid){left=Math.round(left/GRID)*GRID;top=Math.round(top/GRID)*GRID;obj.set({left,top})}
       const box=obj.getBoundingRect();const xs=[0,page.width/2,page.width],ys=[0,page.height/2,page.height];for(const other of canvas.getObjects()){if(other===obj||other.excludeFromExport)continue;const b=other.getBoundingRect();xs.push(b.left,b.left+b.width/2,b.left+b.width);ys.push(b.top,b.top+b.height/2,b.top+b.height)}
       const obx=[box.left,box.left+box.width/2,box.left+box.width],oby=[box.top,box.top+box.height/2,box.top+box.height];let gx:number[]=[];let gy:number[]=[];const threshold=8;
       for(const tx of xs){let best:number|null=null;for(const ox of obx){const diff=tx-ox;if(Math.abs(diff)<=threshold&&(best===null||Math.abs(diff)<Math.abs(best)))best=diff}if(best!==null){obj.set({left:Number(obj.left||0)+best});gx=[tx];break}}
       const box2=obj.getBoundingRect();const oby2=[box2.top,box2.top+box2.height/2,box2.top+box2.height];for(const ty of ys){let best:number|null=null;for(const oy of oby2){const diff=ty-oy;if(Math.abs(diff)<=threshold&&(best===null||Math.abs(diff)<Math.abs(best)))best=diff}if(best!==null){obj.set({top:Number(obj.top||0)+best});gy=[ty];break}}
       obj.setCoords();const b3=obj.getBoundingRect();setGuide({x:gx,y:gy,distances:{left:Math.round(b3.left),right:Math.round(page.width-(b3.left+b3.width)),top:Math.round(b3.top),bottom:Math.round(page.height-(b3.top+b3.height))}});canvas.requestRenderAll();
     };
     canvas.on("selection:created",select);canvas.on("selection:updated",select);canvas.on("selection:cleared",()=>{if(!loading.current){selectedLayerId.current=null;onSelect(null)}});canvas.on("object:moving",snapMove);canvas.on("object:scaling",(e:any)=>snapMove(e));canvas.on("object:rotating",()=>setGuide(null));canvas.on("object:modified",()=>{setGuide(null);snapshot();select()});canvas.on("object:added",snapshot);canvas.on("object:removed",snapshot);canvas.on("path:created",(e:any)=>{if(e?.path){e.path.set({data:{...(e.path.data||{}),kind:"drawing"}});ensureLayerMeta(e.path,canvas.getObjects().length-1);styleObject(e.path)}snapshot()});
     requestAnimationFrame(()=>{try{onThumb(page.id,canvas.toDataURL({format:"jpeg",quality:.55,multiplier:.12}))}catch{}})
   })();
   return()=>{dead=true;onReady(page.id,null);runtime.current=null;canvas?.dispose?.()}
 },[page.id,page.width,grid]);
 useEffect(()=>{const r=runtime.current;if(!r)return;const {canvas,fabric}=r;canvas.isDrawingMode=draw.enabled;if(draw.enabled){const Brush=draw.type==="spray"?fabric.SprayBrush:draw.type==="circle"?fabric.CircleBrush:fabric.PencilBrush;const brush=new Brush(canvas);brush.color=draw.color;brush.width=draw.width;canvas.freeDrawingBrush=brush;canvas.discardActiveObject();canvas.requestRenderAll()}},[draw.enabled,draw.type,draw.color,draw.width]);
 useEffect(()=>{
   if(resizing.current)return;
   const next=Math.max(minPageHeight,Math.round(Number(page.height)||minPageHeight));
   dragHeightRef.current=next;
   setDisplayHeight(next);
   const r=runtime.current;if(!r)return;
   if(Math.round(Number(r.canvas.getHeight())||0)!==next){
     r.canvas.setDimensions({width:r.canvas.getWidth(),height:next});
     r.canvas.calcOffset?.();
     r.canvas.requestRenderAll();
   }
 },[page.height,minPageHeight]);
 useEffect(()=>{const r=runtime.current;if(!r||loading.current)return;const raw=JSON.stringify(page.json||EMPTY_JSON);if(raw===lastJson.current)return;
   // Inspector-side edits already changed the live Fabric canvas. If incoming JSON is identical,
   // do not reload the canvas because loadFromJSON clears the current selection/inspector.
   r.canvas.getObjects().forEach((o:any,i:number)=>ensureLayerMeta(o,i));
   const liveRaw=JSON.stringify(r.canvas.toObject(["data"]));
   if(liveRaw===raw){lastJson.current=raw;r.canvas.requestRenderAll();return}
   const keepLayerId=selectedLayerId.current;
   loading.current=true;
   void r.canvas.loadFromJSON(page.json||EMPTY_JSON).then(()=>{
     r.canvas.getObjects().forEach((o:any,i:number)=>{ensureLayerMeta(o,i);styleObject(o)});
     lastJson.current=raw;loading.current=false;
     if(keepLayerId){
       const restored=r.canvas.getObjects().find((o:any)=>o?.data?.layerId===keepLayerId);
       if(restored){r.canvas.setActiveObject(restored);selectedLayerId.current=keepLayerId;onSelect({pageId:page.id,object:restored})}
     }
     r.canvas.requestRenderAll();
     requestAnimationFrame(()=>{try{onThumb(page.id,r.canvas.toDataURL({format:"jpeg",quality:.55,multiplier:.12}))}catch{}})
   })},[page.json]);
 const scale=fit*zoom;
 const visibleHeight=displayHeight;
 const contentBottomLive=()=>{const r=runtime.current;if(!r)return 0;const bounds=r.canvas.getObjects().filter((o:any)=>!o.excludeFromExport).map((o:any)=>o.getBoundingRect());return bounds.length?Math.max(...bounds.map((b:any)=>b.top+b.height)):0};
 const beginHeightDrag=(e:React.PointerEvent<HTMLDivElement>)=>{
   e.preventDefault();e.stopPropagation();
   const r=runtime.current;if(!r||resizing.current)return;
   resizing.current=true;
   setIsResizing(true);
   const startY=e.clientY;
   const startHeight=Math.max(minPageHeight,Math.round(Number(r.canvas.getHeight())||displayHeight||page.height));
   dragHeightRef.current=startHeight;
   const previousCursor=document.body.style.cursor;
   const previousSelect=document.body.style.userSelect;
   document.body.style.cursor="ns-resize";
   document.body.style.userSelect="none";

   const move=(ev:PointerEvent)=>{
     if(!resizing.current)return;
     ev.preventDefault();
     const liveScale=Math.max(.01,fit*zoom);
     const delta=(ev.clientY-startY)/liveScale;
     // Keep the bottom edge at least 20px below the lowest visible object,
     // while still allowing the user to create as much empty space as desired.
     const contentMin=Math.ceil(contentBottomLive()+20);
     const minHeight=Math.max(minPageHeight,contentMin);
     const next=Math.max(minHeight,Math.round(startHeight+delta));
     dragHeightRef.current=next;
     setDisplayHeight(next);
     r.canvas.setDimensions({width:r.canvas.getWidth(),height:next});
     r.canvas.calcOffset?.();
     r.canvas.requestRenderAll();
   };

   const finish=()=>{
     if(!resizing.current)return;
     resizing.current=false;
     setIsResizing(false);
     window.removeEventListener("pointermove",move);
     window.removeEventListener("pointerup",finish);
     window.removeEventListener("pointercancel",finish);
     window.removeEventListener("blur",finish);
     document.body.style.cursor=previousCursor;
     document.body.style.userSelect=previousSelect;

     const finalHeight=Math.max(minPageHeight,Math.ceil(Number(dragHeightRef.current)||Number(r.canvas.getHeight())||startHeight));
     dragHeightRef.current=finalHeight;
     setDisplayHeight(finalHeight);
     r.canvas.setDimensions({width:r.canvas.getWidth(),height:finalHeight});
     r.canvas.calcOffset?.();
     r.canvas.getObjects().forEach((o:any,i:number)=>ensureLayerMeta(o,i));
     const json=r.canvas.toObject(["data"]);
     lastJson.current=JSON.stringify(json);
     onChange(page.id,{...json,width:r.canvas.getWidth(),height:finalHeight});
     r.canvas.requestRenderAll();
     requestAnimationFrame(()=>{try{onThumb(page.id,r.canvas.toDataURL({format:"jpeg",quality:.55,multiplier:.12}))}catch{}});
   };

   // Use window listeners instead of the small handle itself so the drag keeps working
   // even when the pointer leaves the handle or crosses the canvas/workspace boundary.
   window.addEventListener("pointermove",move,{passive:false});
   window.addEventListener("pointerup",finish);
   window.addEventListener("pointercancel",finish);
   window.addEventListener("blur",finish);
 };
 return <div ref={hostRef} className="fabric-page-host"><div className={`fabric-page-scaled ${isResizing?"is-resizing":""}`} style={{width:page.width*scale,height:visibleHeight*scale}}><div className={`fabric-page-inner ${grid?"is-grid":""}`} style={{width:page.width,height:visibleHeight,transform:`scale(${scale})`}}><div className="fabric-ruler fabric-ruler-x"/><div className="fabric-ruler fabric-ruler-y"/><canvas ref={canvasRef}/>{guide&&<GuideOverlay page={{...page,height:visibleHeight}} guide={guide}/>}</div><div className="fabric-page-resize-handle" role="separator" aria-orientation="horizontal" aria-label="페이지 높이 드래그 조절" title="위아래로 드래그해서 페이지 높이 조절" onPointerDown={beginHeightDrag}><span>↕</span><b>{Math.round(visibleHeight)}px</b></div></div></div>
}

export default function FabricDesigner({value,onChange,pageLabel}:Props){
 const [mode,setMode]=useState<Mode>("desktop"); const [grid,setGrid]=useState(true); const [activePage,setActivePage]=useState(""); const [inspector,setInspector]=useState<Inspector>(null); const [thumbs,setThumbs]=useState<Record<string,string>>({}); const [zoom,setZoom]=useState(1); const [draw,setDraw]=useState<DrawSettings>({enabled:false,type:"pencil",color:"#222222",width:6}); const runtime=useRef<Record<string,FabricRuntime>>({}); const fileRef=useRef<HTMLInputElement|null>(null); const svgRef=useRef<HTMLInputElement|null>(null); const history=useRef<FabricResponsiveDocument[]>([]); const future=useRef<FabricResponsiveDocument[]>([]); const clipboard=useRef<any>(null); const skipHistory=useRef(false);
 const normalized=useMemo(()=>({desktop:ensureDoc(value?.desktop,"desktop"),mobile:ensureDoc(value?.mobile,"mobile")}),[value]); const doc=normalized[mode]; const pageId=activePage&&doc.pages.some(p=>p.id===activePage)?activePage:doc.pages[0]?.id||"";
 const normalizedPersisted=useRef(false);
 useEffect(()=>{if(!activePage&&doc.pages[0])setActivePage(doc.pages[0].id)},[mode,doc.pages.length]);
 useEffect(()=>{
   const onKey=(e:KeyboardEvent)=>{
     if(e.key!=="Delete"&&e.key!=="Backspace")return;
     const target=e.target as HTMLElement|null;
     const tag=target?.tagName?.toLowerCase();
     if(tag==="input"||tag==="textarea"||tag==="select"||target?.isContentEditable)return;
     const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;
     if(obj.isEditing)return;
     e.preventDefault();
     if(obj.type==="activeselection"||obj.type==="activeSelection"){
       obj.getObjects().forEach((o:any)=>r.canvas.remove(o));
     }else{
       r.canvas.remove(obj);
     }
     r.canvas.discardActiveObject();r.canvas.requestRenderAll();setInspector(null);snapshot();
   };
   window.addEventListener("keydown",onKey);
   return()=>window.removeEventListener("keydown",onKey);
 },[pageId,mode]);
 useEffect(()=>{
   if(normalizedPersisted.current)return;
   const source=value;
   if(!source)return;
   const hasMismatch=(m:Mode)=>(source[m]?.pages||[]).some((p:any)=>p.width!==COMMON_PAGE_SIZE[m].width||Number(p.height||0)<COMMON_PAGE_SIZE[m].height);
   if(hasMismatch("desktop")||hasMismatch("mobile")){
     normalizedPersisted.current=true;
     onChange(normalized);
   }
 },[value,normalized,onChange]);
 const commit=(next:FabricResponsiveDocument,record=true)=>{if(record&&!skipHistory.current){history.current.push(cloneJson(normalized));if(history.current.length>60)history.current.shift();future.current=[]}onChange(next)};
 const updateDoc=(nextDoc:FabricDocument,record=true)=>commit({...normalized,[mode]:nextDoc},record);
 const updatePageJson=(id:string,json:any)=>{
   const width=Math.max(1,Number(json?.width||doc.pages.find(p=>p.id===id)?.width||pageSize(mode).width));
   const height=Math.max(pageSize(mode).height,Number(json?.height||doc.pages.find(p=>p.id===id)?.height||pageSize(mode).height));
   const cleanJson={...json};delete cleanJson.width;delete cleanJson.height;
   const next={...doc,pages:doc.pages.map(p=>p.id===id?{...p,width,height,json:cleanJson}:p)};
   commit({...normalized,[mode]:next},true);
 };
 const pageRuntime=()=>runtime.current[pageId];
 const snapshot=()=>{const r=pageRuntime();if(!r)return;r.canvas.getObjects().forEach((o:any,i:number)=>ensureLayerMeta(o,i));updatePageJson(pageId,{...r.canvas.toObject(["data"]),width:r.canvas.getWidth(),height:r.canvas.getHeight()})};
 const isLegacyRectLine=(obj:any)=>["hline","vline"].includes(getKind(obj))&&obj?.type==="rect";
 const visualLineWidth=(obj:any)=>{
   const k=getKind(obj);
   if(isLegacyRectLine(obj)){
     return k==="hline"?Math.max(0,Number(obj.height||0)*Number(obj.scaleY||1)):Math.max(0,Number(obj.width||0)*Number(obj.scaleX||1));
   }
   return Math.max(0,Number(obj?.strokeWidth??0));
 };
 const setLineColor=(color:string)=>{
   const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;
   if(isLegacyRectLine(obj))obj.set({fill:color,stroke:color});else obj.set({stroke:color});
   obj.setCoords?.();r.canvas.requestRenderAll();setInspector({pageId,object:obj});snapshot();
 };
 const setLineWidth=(value:number)=>{
   const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;
   const width=Math.max(0,Math.min(50,Number.isFinite(value)?value:0));
   const k=getKind(obj);
   if(isLegacyRectLine(obj)){
     if(k==="hline")obj.set({height:width,scaleY:1,fill:width===0?"transparent":(obj.fill||obj.stroke||"#6c625c")});
     else obj.set({width,scaleX:1,fill:width===0?"transparent":(obj.fill||obj.stroke||"#6c625c")});
   }else{
     obj.set({strokeWidth:width,visible:true});
   }
   obj.setCoords?.();r.canvas.requestRenderAll();setInspector({pageId,object:obj});snapshot();
 };
 const addObject=(obj:any,center=true)=>{const r=pageRuntime();if(!r)return;setDraw(x=>({...x,enabled:false}));ensureLayerMeta(obj,r.canvas.getObjects().length);styleObject(obj);r.canvas.add(obj);r.canvas.setActiveObject(obj);if(center)r.canvas.centerObject(obj);r.canvas.requestRenderAll()};
 const addText=()=>{const r=pageRuntime();if(!r)return;addObject(new r.fabric.IText("텍스트를 입력하세요",{left:80,top:80,fontSize:32,fontFamily:"Arial",fill:"#3d2b20",data:{kind:"text"}}))};
 const addRect=()=>{const r=pageRuntime();if(!r)return;addObject(new r.fabric.Rect({left:100,top:100,width:320,height:180,fill:"#ffffff",stroke:"#6c625c",strokeWidth:1,data:{kind:"rect"}}))};
 const addCircle=()=>{const r=pageRuntime();if(!r)return;addObject(new r.fabric.Circle({left:120,top:120,radius:90,fill:"#f3eee9",stroke:"#6c625c",strokeWidth:1,data:{kind:"circle"}}))};
 const addEllipse=()=>{const r=pageRuntime();if(!r)return;addObject(new r.fabric.Ellipse({left:120,top:120,rx:130,ry:80,fill:"#f3eee9",stroke:"#6c625c",strokeWidth:1,data:{kind:"ellipse"}}))};
 const addTriangle=()=>{const r=pageRuntime();if(!r)return;addObject(new r.fabric.Triangle({left:120,top:120,width:220,height:190,fill:"#f3eee9",stroke:"#6c625c",strokeWidth:1,data:{kind:"triangle"}}))};
 const addStar=()=>{const r=pageRuntime();if(!r)return;const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2===0?100:45;pts.push({x:Math.cos(a)*rad,y:Math.sin(a)*rad})}addObject(new r.fabric.Polygon(pts,{left:160,top:140,fill:"#f3eee9",stroke:"#6c625c",strokeWidth:1,data:{kind:"star"}}))};
 const addHLine=()=>{const r=pageRuntime();if(!r)return;addObject(new r.fabric.Line([0,0,360,0],{left:100,top:180,stroke:"#6c625c",strokeWidth:1,fill:"transparent",data:{kind:"hline"},strokeUniform:true,selectable:true,evented:true,lockMovementX:false,lockMovementY:false}))};
 const addVLine=()=>{const r=pageRuntime();if(!r)return;addObject(new r.fabric.Line([0,0,0,360],{left:200,top:100,stroke:"#6c625c",strokeWidth:1,fill:"transparent",data:{kind:"vline"},strokeUniform:true,selectable:true,evented:true,lockMovementX:false,lockMovementY:false}))};
 const addImage=()=>fileRef.current?.click();
 const onFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;try{const src=await imageFileToDataUrl(file);const r=pageRuntime();const p=doc.pages.find(p=>p.id===pageId);if(!r||!p)return;const img=await r.fabric.FabricImage.fromURL(src);img.set({left:0,top:0,data:{kind:"image",filters:{brightness:0,contrast:0,blur:0,grayscale:false}}});if(Number(img.width||0)>0)img.scaleToWidth(p.width);img.set({left:0,top:0});img.setCoords();addObject(img,false)}catch(err){showAdminToast(err instanceof Error?err.message:"이미지 처리 실패","error")}};
 const addSvg=()=>svgRef.current?.click();
 const onSvg=async(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;try{const text=await file.text();const r=pageRuntime();if(!r)return;const parsed=await r.fabric.loadSVGFromString(text);const objects=(parsed.objects||[]).filter(Boolean);if(!objects.length)throw new Error("SVG에서 표시 가능한 요소를 찾지 못했습니다.");const obj=r.fabric.util.groupSVGElements(objects,parsed.options||{});obj.set({left:120,top:120,data:{kind:"svg"}});const max=Math.min(650,doc.pages.find(p=>p.id===pageId)?.width||650);if(obj.width>max)obj.scaleToWidth(max);addObject(obj)}catch(err){showAdminToast(err instanceof Error?err.message:"SVG 불러오기 실패","error")}};
 const duplicate=()=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;void obj.clone(["data"]).then((cl:any)=>{cl.set({left:Number(cl.left||0)+24,top:Number(cl.top||0)+24});renewLayerMeta(cl,r.canvas.getObjects().length);styleObject(cl);r.canvas.add(cl);r.canvas.setActiveObject(cl);r.canvas.requestRenderAll()})};
 const copy=()=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;void obj.clone(["data"]).then((cl:any)=>{clipboard.current=cl;showAdminToast("복사했습니다.","success")})};
 const paste=()=>{const r=pageRuntime();if(!r||!clipboard.current)return;void clipboard.current.clone(["data"]).then((cl:any)=>{cl.set({left:Number(cl.left||0)+28,top:Number(cl.top||0)+28,evented:true});renewLayerMeta(cl,r.canvas.getObjects().length);styleObject(cl);r.canvas.add(cl);r.canvas.setActiveObject(cl);r.canvas.requestRenderAll();clipboard.current=cl})};
 const remove=()=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;if(obj.type==="activeselection"||obj.type==="activeSelection")obj.getObjects().forEach((o:any)=>r.canvas.remove(o));else r.canvas.remove(obj);r.canvas.discardActiveObject();r.canvas.requestRenderAll();setInspector(null)};
 const groupSelection=()=>{const r=pageRuntime();const active=r?.canvas.getActiveObject();if(!r||!active||!active.getObjects)return;const objects=active.getObjects();if(objects.length<2)return;const group=new r.fabric.Group(objects,{data:{kind:"group",layerId:uid("layer"),layerName:`그룹 ${r.canvas.getObjects().length+1}`}});r.canvas.discardActiveObject();objects.forEach((o:any)=>r.canvas.remove(o));styleObject(group);r.canvas.add(group);r.canvas.setActiveObject(group);r.canvas.requestRenderAll();snapshot()};
 const ungroup=()=>{const r=pageRuntime();const group=r?.canvas.getActiveObject();if(!r||!group||getKind(group)!=="group"||!group.removeAll)return;const plane=group.calcTransformMatrix();const objects=group.removeAll();r.canvas.remove(group);for(const o of objects){r.fabric.util.sendObjectToPlane(o,plane,undefined);styleObject(o);r.canvas.add(o)}const selection=new r.fabric.ActiveSelection(objects,{canvas:r.canvas});r.canvas.setActiveObject(selection);r.canvas.requestRenderAll();snapshot()};
 const layer=(action:"front"|"forward"|"backward"|"back")=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;({front:()=>r.canvas.bringObjectToFront(obj),forward:()=>r.canvas.bringObjectForward(obj),backward:()=>r.canvas.sendObjectBackwards(obj),back:()=>r.canvas.sendObjectToBack(obj)})[action]();r.canvas.requestRenderAll();snapshot()};
 const setProp=(key:string,val:any)=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;obj.set(key,val);obj.setCoords();r.canvas.requestRenderAll();setInspector({pageId,object:obj});snapshot()};
 const toggleLock=()=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;const locked=!!obj.lockMovementX;obj.set({lockMovementX:!locked,lockMovementY:!locked,lockScalingX:!locked,lockScalingY:!locked,lockRotation:!locked,hasControls:locked?true:false,data:{...(obj.data||{}),locked:!locked}});obj.setCoords();r.canvas.requestRenderAll();snapshot()};
 const flip=(axis:"x"|"y")=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;obj.set(axis==="x"?"flipX":"flipY",!obj[axis==="x"?"flipX":"flipY"]);obj.setCoords();r.canvas.requestRenderAll();snapshot()};
 const align=(where:"left"|"centerX"|"right"|"top"|"centerY"|"bottom")=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();const p=doc.pages.find(p=>p.id===pageId);if(!r||!obj||!p)return;const b=obj.getBoundingRect();let left=Number(obj.left||0),top=Number(obj.top||0);if(where==="left")left+=-b.left;if(where==="centerX")left+=p.width/2-(b.left+b.width/2);if(where==="right")left+=p.width-(b.left+b.width);if(where==="top")top+=-b.top;if(where==="centerY")top+=p.height/2-(b.top+b.height/2);if(where==="bottom")top+=p.height-(b.top+b.height);obj.set({left,top});obj.setCoords();r.canvas.requestRenderAll();snapshot()};
 const applyGradient=()=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;const width=Math.max(1,obj.width||200);obj.set("fill",new r.fabric.Gradient({type:"linear",coords:{x1:0,y1:0,x2:width,y2:0},colorStops:[{offset:0,color:"#ffffff"},{offset:1,color:"#9b8a7f"}]}));r.canvas.requestRenderAll();snapshot()};
 const applyShadow=(blur:number)=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj)return;obj.set("shadow",blur>0?new r.fabric.Shadow({color:"rgba(0,0,0,0.28)",blur,offsetX:4,offsetY:6}):null);r.canvas.requestRenderAll();snapshot()};
 const setImageFilter=(key:"brightness"|"contrast"|"blur"|"grayscale",value:number|boolean)=>{const r=pageRuntime();const obj=r?.canvas.getActiveObject();if(!r||!obj||getKind(obj)!=="image")return;const fs={brightness:0,contrast:0,blur:0,grayscale:false,...(obj.data?.filters||{}),[key]:value};const filters=[];if(fs.brightness)filters.push(new r.fabric.filters.Brightness({brightness:Number(fs.brightness)}));if(fs.contrast)filters.push(new r.fabric.filters.Contrast({contrast:Number(fs.contrast)}));if(fs.blur)filters.push(new r.fabric.filters.Blur({blur:Number(fs.blur)}));if(fs.grayscale)filters.push(new r.fabric.filters.Grayscale());obj.filters=filters;obj.data={...(obj.data||{}),filters:fs};obj.applyFilters();r.canvas.requestRenderAll();setInspector({pageId,object:obj});snapshot()};
 const setCanvasBg=(color:string)=>{const r=pageRuntime();if(!r)return;r.canvas.backgroundColor=color;r.canvas.requestRenderAll();snapshot()};
 const addPage=()=>{const p=blankPage(mode);updateDoc({...doc,pages:[...doc.pages,p]});setActivePage(p.id);requestAnimationFrame(()=>document.getElementById(`fabric-page-${p.id}`)?.scrollIntoView({behavior:"smooth",block:"center"}))};
 const dupPage=()=>{const idx=doc.pages.findIndex(p=>p.id===pageId);if(idx<0)return;const src=doc.pages[idx];const cp={...cloneJson(src),id:uid(),json:cloneJson(src.json)};const pages=[...doc.pages];pages.splice(idx+1,0,cp);updateDoc({...doc,pages});setActivePage(cp.id)};
 const deletePage=()=>{if(doc.pages.length<=1){showAdminToast("마지막 페이지는 삭제할 수 없습니다.","error");return}if(!confirm("현재 페이지를 삭제할까요?"))return;const idx=doc.pages.findIndex(p=>p.id===pageId);const pages=doc.pages.filter(p=>p.id!==pageId);updateDoc({...doc,pages});setActivePage(pages[Math.max(0,idx-1)]?.id||pages[0].id)};
 const movePage=(dir:-1|1)=>{const idx=doc.pages.findIndex(p=>p.id===pageId);const t=idx+dir;if(idx<0||t<0||t>=doc.pages.length)return;const pages=[...doc.pages];[pages[idx],pages[t]]=[pages[t],pages[idx]];updateDoc({...doc,pages})};
 const contentBottom=()=>{const r=pageRuntime();if(!r)return 0;const bounds=r.canvas.getObjects().filter((o:any)=>!o.excludeFromExport).map((o:any)=>o.getBoundingRect());return bounds.length?Math.max(...bounds.map((b:any)=>b.top+b.height)):0};
 const currentBottomSpace=()=>{const r=pageRuntime();if(!r)return 0;return Math.max(0,Math.round(r.canvas.getHeight()-contentBottom()))};
 const fitPageToContent=()=>{const r=pageRuntime();const p=doc.pages.find(p=>p.id===pageId);if(!r||!p)return;const maxBottom=contentBottom();const height=Math.max(pageSize(mode).height,Math.ceil(maxBottom+120));r.canvas.setHeight(height);r.canvas.requestRenderAll();snapshot();showAdminToast(`콘텐츠 아래 여백 120px을 포함해 페이지 높이를 ${height}px로 맞췄습니다.`,"success")};
 const setCurrentPageHeight=(height:number)=>{const r=pageRuntime();if(!r)return;const minHeight=Math.max(pageSize(mode).height,Math.ceil(contentBottom()));const next=Math.max(minHeight,Math.round(Number(height)||minHeight));r.canvas.setHeight(next);r.canvas.requestRenderAll();snapshot()};
 const setBottomSpace=(space:number)=>{const r=pageRuntime();if(!r)return;const gap=Math.max(0,Math.round(Number(space)||0));const next=Math.max(pageSize(mode).height,Math.ceil(contentBottom()+gap));r.canvas.setHeight(next);r.canvas.requestRenderAll();snapshot()};
 const resizeCurrent=()=>{const r=pageRuntime();const p=doc.pages.find(p=>p.id===pageId);if(!r||!p)return;const size=pageSize(mode);const sx=size.width/p.width;if(sx!==1){r.canvas.getObjects().forEach((o:any)=>{o.set({left:Number(o.left||0)*sx,top:Number(o.top||0)*sx,scaleX:Number(o.scaleX||1)*sx,scaleY:Number(o.scaleY||1)*sx});o.setCoords()})}const bounds=r.canvas.getObjects().filter((o:any)=>!o.excludeFromExport).map((o:any)=>o.getBoundingRect());const maxBottom=bounds.length?Math.max(...bounds.map((b:any)=>b.top+b.height)):0;const height=Math.max(size.height,Math.ceil(maxBottom+120));r.canvas.setDimensions({width:size.width,height});r.canvas.requestRenderAll();snapshot();showAdminToast("가로 공통 규격 + 콘텐츠 높이로 맞췄습니다.","success")};
 const undo=()=>{const prev=history.current.pop();if(!prev)return;future.current.push(cloneJson(normalized));skipHistory.current=true;onChange(prev);setTimeout(()=>{skipHistory.current=false},0)}; const redo=()=>{const next=future.current.pop();if(!next)return;history.current.push(cloneJson(normalized));skipHistory.current=true;onChange(next);setTimeout(()=>{skipHistory.current=false},0)};
 const selected=inspector?.object;const kind=getKind(selected);const imageFilters=selected?.data?.filters||{brightness:0,contrast:0,blur:0,grayscale:false};
 const activeObjects=pageRuntime()?.canvas?.getObjects?.()||[];
 return <section className="fabric-editor-shell fabric-full-editor">
  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile}/><input ref={svgRef} type="file" accept="image/svg+xml,.svg" hidden onChange={onSvg}/>
  <header className="fabric-editor-top"><strong>{pageLabel} · Fabric Full Editor</strong><div className="fabric-mode"><button type="button" className={mode==="desktop"?"is-active":""} onClick={()=>{setMode("desktop");setInspector(null);setActivePage("")}}>Desktop</button><button type="button" className={mode==="mobile"?"is-active":""} onClick={()=>{setMode("mobile");setInspector(null);setActivePage("")}}>Mobile</button></div><button type="button" onClick={undo} disabled={!history.current.length}>↶ Undo</button><button type="button" onClick={redo} disabled={!future.current.length}>↷ Redo</button><button type="button" className={grid?"is-active":""} onClick={()=>setGrid(v=>!v)}>Grid {grid?"ON":"OFF"}</button><label className="fabric-zoom">Zoom <input type="range" min="0.45" max="1.6" step="0.05" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><span>{Math.round(zoom*100)}%</span></label><button type="button" onClick={()=>setZoom(1)}>100%</button><button type="button" onClick={resizeCurrent}>공통 규격으로 맞춤</button></header>
  <div className="fabric-editor-main">
   <aside className="fabric-tools fabric-tools-full">
    <div className="fabric-tool-section"><h4>추가</h4><button type="button" onClick={addText}><b>T</b><span>텍스트</span></button><button type="button" onClick={addImage}><b>▧</b><span>이미지</span></button><button type="button" onClick={addSvg}><b>◇</b><span>SVG</span></button></div>
    <div className="fabric-tool-section"><h4>도형</h4><button type="button" onClick={addRect}><b>□</b><span>사각형</span></button><button type="button" onClick={addCircle}><b>○</b><span>원</span></button><button type="button" onClick={addEllipse}><b>⬭</b><span>타원</span></button><button type="button" onClick={addTriangle}><b>△</b><span>삼각형</span></button><button type="button" onClick={addStar}><b>☆</b><span>별</span></button><button type="button" onClick={addHLine}><b>━</b><span>가로선</span></button><button type="button" onClick={addVLine}><b>┃</b><span>세로선</span></button></div>
    <div className="fabric-tool-section"><h4>드로잉</h4><button type="button" className={draw.enabled?"is-active":""} onClick={()=>setDraw(x=>({...x,enabled:!x.enabled}))}><b>✎</b><span>{draw.enabled?"선택 모드":"그리기"}</span></button><select value={draw.type} onChange={e=>setDraw(x=>({...x,type:e.target.value as BrushType}))}><option value="pencil">Pencil</option><option value="spray">Spray</option><option value="circle">Circle</option></select><input aria-label="브러시 색상" type="color" value={draw.color} onChange={e=>setDraw(x=>({...x,color:e.target.value}))}/><input aria-label="브러시 굵기" type="range" min="1" max="60" value={draw.width} onChange={e=>setDraw(x=>({...x,width:Number(e.target.value)}))}/></div>
    <div className="fabric-tool-section"><h4>편집</h4><small className="fabric-tool-hint">선택 후 Delete / Backspace 삭제</small><button type="button" onClick={copy}><b>⧉</b><span>복사</span></button><button type="button" onClick={paste}><b>▣</b><span>붙여넣기</span></button><button type="button" onClick={duplicate}><b>⧉</b><span>복제</span></button><button type="button" onClick={groupSelection}><b>⊞</b><span>그룹</span></button><button type="button" onClick={ungroup}><b>⊟</b><span>그룹해제</span></button><button type="button" onClick={remove}><b>⌫</b><span>삭제</span></button></div>
   </aside>
   <div className={`fabric-workspace ${grid?"show-grid":""}`}>{doc.pages.map((page,index)=><div key={page.id} id={`fabric-page-${page.id}`} className={`fabric-page-card ${page.id===pageId?"is-active":""}`} onMouseDown={()=>setActivePage(page.id)}><div className="fabric-page-label">{index+1} PAGE · {page.width}×{page.height}</div><CanvasPage page={page} grid={grid} zoom={zoom} draw={page.id===pageId?draw:{...draw,enabled:false}} minPageHeight={pageSize(mode).height} onReady={(id,r)=>{if(r)runtime.current[id]=r;else delete runtime.current[id]}} onChange={updatePageJson} onSelect={(v)=>{setInspector(v);if(v)setActivePage(v.pageId)}} onThumb={(id,url)=>setThumbs(x=>({...x,[id]:url}))}/></div>)}</div>
   <aside className="fabric-inspector fabric-inspector-full"><h3>{selected?`${kind} 설정`:"페이지 / 요소 설정"}</h3>
    <section><h4>페이지</h4><label>배경색<input type="color" defaultValue="#ffffff" onChange={e=>setCanvasBg(e.target.value)}/></label><label>페이지 높이<input type="number" min={pageSize(mode).height} step="1" value={doc.pages.find(p=>p.id===pageId)?.height||pageSize(mode).height} onChange={e=>setCurrentPageHeight(Number(e.target.value))}/></label><label>이미지/콘텐츠 아래 여백<input type="number" min="0" step="1" value={currentBottomSpace()} onChange={e=>setBottomSpace(Number(e.target.value))}/></label><div className="fabric-inline-actions"><button type="button" onClick={fitPageToContent}>콘텐츠 높이에 자동 맞춤 (+120px)</button></div><small className="fabric-field-help">페이지 맨 아래의 ↕ 손잡이를 위아래로 드래그하면 하단 여백과 페이지 높이를 직관적으로 조절할 수 있습니다. 숫자 입력도 그대로 사용할 수 있습니다.</small><div className="fabric-align-grid"><button type="button" onClick={()=>align("left")}>←</button><button type="button" onClick={()=>align("centerX")}>↔</button><button type="button" onClick={()=>align("right")}>→</button><button type="button" onClick={()=>align("top")}>↑</button><button type="button" onClick={()=>align("centerY")}>↕</button><button type="button" onClick={()=>align("bottom")}>↓</button></div></section>
    {selected?<><section><h4>변형</h4><label>X<input type="number" value={Math.round(selected.left||0)} onChange={e=>setProp("left",Number(e.target.value))}/></label><label>Y<input type="number" value={Math.round(selected.top||0)} onChange={e=>setProp("top",Number(e.target.value))}/></label><label>회전<input type="number" value={Math.round(selected.angle||0)} onChange={e=>setProp("angle",Number(e.target.value))}/></label><label>투명도<input type="range" min="0" max="1" step="0.05" value={selected.opacity??1} onChange={e=>setProp("opacity",Number(e.target.value))}/></label><label>Skew X<input type="number" min="-60" max="60" value={Math.round(selected.skewX||0)} onChange={e=>setProp("skewX",Number(e.target.value))}/></label><label>Skew Y<input type="number" min="-60" max="60" value={Math.round(selected.skewY||0)} onChange={e=>setProp("skewY",Number(e.target.value))}/></label><div className="fabric-inline-actions"><button type="button" onClick={()=>flip("x")}>좌우 반전</button><button type="button" onClick={()=>flip("y")}>상하 반전</button><button type="button" onClick={toggleLock}>{selected.lockMovementX?"잠금 해제":"잠금"}</button></div></section>
      {kind==="text"&&<section><h4>텍스트</h4><label>글자 크기<input type="number" min="8" max="260" value={selected.fontSize||32} onChange={e=>setProp("fontSize",Number(e.target.value))}/></label><label>폰트<select value={selected.fontFamily||"Arial"} onChange={e=>setProp("fontFamily",e.target.value)}><option>Arial</option><option>Georgia</option><option>Times New Roman</option><option>Helvetica</option><option>Noto Sans KR</option><option>serif</option><option>sans-serif</option></select></label><label>글자색<input type="color" value={typeof selected.fill==="string"?selected.fill:"#3d2b20"} onChange={e=>setProp("fill",e.target.value)}/></label><label>행간<input type="number" min="0.6" max="3" step="0.1" value={selected.lineHeight||1.16} onChange={e=>setProp("lineHeight",Number(e.target.value))}/></label><label>자간<input type="number" min="-300" max="1200" value={selected.charSpacing||0} onChange={e=>setProp("charSpacing",Number(e.target.value))}/></label><label>정렬<select value={selected.textAlign||"left"} onChange={e=>setProp("textAlign",e.target.value)}><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option><option value="justify">양쪽</option></select></label><div className="fabric-inline-actions"><button type="button" onClick={()=>setProp("fontWeight",selected.fontWeight==="bold"?"normal":"bold")}>Bold</button><button type="button" onClick={()=>setProp("fontStyle",selected.fontStyle==="italic"?"normal":"italic")}>Italic</button><button type="button" onClick={()=>setProp("underline",!selected.underline)}>Underline</button><button type="button" onClick={()=>setProp("linethrough",!selected.linethrough)}>Strike</button></div></section>}
      {["rect","circle","ellipse","triangle","star","hline","vline","svg","drawing"].includes(kind)&&<section><h4>색상 / 선</h4>
       {!["hline","vline"].includes(kind)&&<label>채우기<input type="color" value={typeof selected.fill==="string"?selected.fill:"#f3eee9"} onChange={e=>setProp("fill",e.target.value)}/></label>}
       <label>선 색상<input type="color" value={typeof (["hline","vline"].includes(kind)&&isLegacyRectLine(selected)?selected.fill:selected.stroke)==="string"?(["hline","vline"].includes(kind)&&isLegacyRectLine(selected)?selected.fill:selected.stroke):"#6c625c"} onChange={e=>["hline","vline"].includes(kind)?setLineColor(e.target.value):setProp("stroke",e.target.value)}/></label>
       <label>선 굵기(px)<input type="number" min="0" max="50" step="0.5" value={["hline","vline"].includes(kind)?visualLineWidth(selected):Math.max(0,Number(selected.strokeWidth??0))} onChange={e=>["hline","vline"].includes(kind)?setLineWidth(Number(e.target.value)):setProp("strokeWidth",Math.max(0,Number(e.target.value)))}/></label>
       <small className="fabric-field-help">0 = 선 없음 · 0.5px부터 실제 굵기로 적용</small>
       {!["hline","vline"].includes(kind)&&<div className="fabric-inline-actions"><button type="button" onClick={applyGradient}>그라디언트</button><button type="button" onClick={()=>applyShadow(selected.shadow?0:18)}>{selected.shadow?"그림자 제거":"그림자"}</button></div>}
      </section>}
      {kind==="image"&&<section><h4>이미지 필터</h4><label>밝기<input type="range" min="-1" max="1" step="0.05" value={imageFilters.brightness||0} onChange={e=>setImageFilter("brightness",Number(e.target.value))}/></label><label>대비<input type="range" min="-1" max="1" step="0.05" value={imageFilters.contrast||0} onChange={e=>setImageFilter("contrast",Number(e.target.value))}/></label><label>블러<input type="range" min="0" max="1" step="0.05" value={imageFilters.blur||0} onChange={e=>setImageFilter("blur",Number(e.target.value))}/></label><label className="fabric-check"><input type="checkbox" checked={!!imageFilters.grayscale} onChange={e=>setImageFilter("grayscale",e.target.checked)}/> 흑백</label><div className="fabric-inline-actions"><button type="button" onClick={()=>{setImageFilter("brightness",0);setImageFilter("contrast",0);setImageFilter("blur",0);setImageFilter("grayscale",false)}}>필터 초기화</button></div></section>}
      <section><h4>레이어</h4><div className="fabric-layer-actions"><button type="button" onClick={()=>layer("front")}>맨 앞으로</button><button type="button" onClick={()=>layer("forward")}>앞으로</button><button type="button" onClick={()=>layer("backward")}>뒤로</button><button type="button" onClick={()=>layer("back")}>맨 뒤로</button></div></section>
     </>:<p>캔버스에서 요소를 선택하세요.</p>}
    <section className="fabric-layer-list"><h4>현재 페이지 레이어</h4>{[...activeObjects].reverse().map((o:any,i:number)=><button type="button" key={o?.data?.layerId||`${getKind(o)}-${i}`} onClick={()=>{const r=pageRuntime();if(!r)return;r.canvas.setActiveObject(o);r.canvas.requestRenderAll();setInspector({pageId,object:o})}}><span>{objectName(o,activeObjects.length-1-i)}</span><small>{o.visible===false?"숨김":o.lockMovementX?"잠금":""}</small></button>)}</section>
   </aside>
  </div>
  <footer className="fabric-pages-bar"><div className="fabric-thumbs">{doc.pages.map((p,i)=><button type="button" key={p.id} className={p.id===pageId?"is-active":""} onClick={()=>{setActivePage(p.id);document.getElementById(`fabric-page-${p.id}`)?.scrollIntoView({behavior:"smooth",block:"center"})}}>{thumbs[p.id]?<img src={thumbs[p.id]} alt=""/>:<span>{i+1}</span>}<small>{i+1}</small></button>)}</div><div className="fabric-page-buttons"><button type="button" onClick={addPage}>+ 페이지 추가</button><button type="button" onClick={dupPage}>페이지 복제</button><button type="button" onClick={()=>movePage(-1)}>← 순서</button><button type="button" onClick={()=>movePage(1)}>순서 →</button><button type="button" onClick={deletePage}>페이지 삭제</button></div></footer>
 </section>
}

function GuideOverlay({page,guide}:{page:FabricPage;guide:GuideState}){return <div className="fabric-guide-overlay" aria-hidden="true">{guide.x.map((x,i)=><i key={`x${i}`} className="fabric-guide-x" style={{left:`${x/page.width*100}%`}}/>)}{guide.y.map((y,i)=><i key={`y${i}`} className="fabric-guide-y" style={{top:`${y/page.height*100}%`}}/>)}{guide.distances&&<><b className="fabric-distance d-left">{guide.distances.left}px</b><b className="fabric-distance d-right">{guide.distances.right}px</b><b className="fabric-distance d-top">{guide.distances.top}px</b><b className="fabric-distance d-bottom">{guide.distances.bottom}px</b></>}</div>}
