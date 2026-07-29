"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect,useState } from "react";
import { ENGAGEMENT_EVENT, readScraps, type ScrapItem } from "@/lib/engagement";
import ScrapButton from "@/components/project/ScrapButton";
export default function ScrapBoard(){
 const [items,setItems]=useState<ScrapItem[]>([]);
 useEffect(()=>{const sync=()=>setItems(readScraps());sync();window.addEventListener("storage",sync);window.addEventListener(ENGAGEMENT_EVENT,sync);return()=>{window.removeEventListener("storage",sync);window.removeEventListener(ENGAGEMENT_EVENT,sync)}},[]);
 if(!items.length)return <p className="scrap-empty">아직 스크랩한 이미지가 없습니다.</p>;
 return <section className="scrap-masonry" aria-live="polite">{items.map(item=><article className={`scrap-card scrap-card--${item.kind}`} key={item.id}>
  <Link href={`/project/view/?slug=${encodeURIComponent(item.projectSlug)}`}>
   <div className="scrap-card-image"><Image src={item.src} alt={item.alt} width={item.kind==="project"?1600:1200} height={item.kind==="project"?1050:1600} unoptimized={item.src.startsWith("data:")} sizes="(max-width:900px) calc((100vw - 54px)/2), 32vw"/></div>
   <div className="scrap-card-meta"><span>{item.kind==="project"?"PROJECT":"IMAGE"}</span><strong>{item.projectTitle}</strong></div>
  </Link>
  <ScrapButton className="scrap-board-heart" item={{id:item.id,kind:item.kind,projectSlug:item.projectSlug,projectTitle:item.projectTitle,src:item.src,alt:item.alt}} />
 </article>)}</section>
}
