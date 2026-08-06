"use client";
import { useEffect, useMemo, useState } from "react";
import { Workspace } from "polotno/canvas/workspace";
import { createStore } from "polotno/model/store";
import type { PolotnoDesign } from "@/lib/page-content";

type Props={desktop:PolotnoDesign;mobile:PolotnoDesign;label:string};
function buildStore(){const key=process.env.NEXT_PUBLIC_POLOTNO_KEY||"";return key?createStore({key,showCredit:true}):createStore({showCredit:true})}
export default function PolotnoViewer({desktop,mobile,label}:Props){
 const [isMobile,setIsMobile]=useState(false); const [ready,setReady]=useState(false); const store=useMemo(()=>buildStore(),[]);
 useEffect(()=>{const sync=()=>setIsMobile(window.innerWidth<=768);sync();window.addEventListener("resize",sync);return()=>window.removeEventListener("resize",sync)},[]);
 useEffect(()=>{const design=isMobile?(mobile||desktop):(desktop||mobile);setReady(false);store.clear();if(design&&Object.keys(design).length){Promise.resolve(store.loadJSON(design as any)).then(()=>{store.setRole("viewer");setReady(true)}).catch(()=>setReady(false));}},[desktop,mobile,isMobile,store]);
 if(!ready)return null;
 return <section className="polotno-public-viewer" aria-label={label}><Workspace store={store} layout="vertical" paddingX={0} paddingY={0} pageGap={0} components={{PageControls:()=>null}} /></section>;
}
