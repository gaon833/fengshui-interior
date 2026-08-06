"use client";
import dynamic from "next/dynamic";
import type { PolotnoDesign } from "@/lib/page-content";
const Viewer=dynamic(()=>import("@/components/polotno/PolotnoViewer"),{ssr:false});
export default function PolotnoViewerClient(props:{desktop:PolotnoDesign;mobile:PolotnoDesign;label:string}){return <Viewer {...props}/>}
