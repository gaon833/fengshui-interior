"use client";
import dynamic from "next/dynamic";
import type { PolotnoDesign } from "@/lib/page-content";
const Designer = dynamic(() => import("@/components/polotno/PolotnoDesigner"), { ssr: false, loading: () => <div className="polotno-loading">Polotno 편집기를 불러오는 중...</div> });
export default function PolotnoDesignerClient(props:{desktop:PolotnoDesign;mobile:PolotnoDesign;onDesktopChange:(d:PolotnoDesign)=>void;onMobileChange:(d:PolotnoDesign)=>void;pageLabel:string}){return <Designer {...props}/>}
