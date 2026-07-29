"use client";
import { useEffect, useMemo, useState } from "react";
import { ENGAGEMENT_EVENT, readEngagementEvents, readScraps } from "@/lib/engagement";
import { GALLERY_ANALYTICS_EVENT, readGalleryAnalytics } from "@/lib/gallery-analytics";
import { GALLERY_EVENT, readGalleryItems } from "@/lib/gallery-store";

function topCounts(values: string[], limit = 6) {
  const map = new Map<string, number>(); values.filter(Boolean).forEach((v) => map.set(v, (map.get(v) || 0) + 1));
  return [...map.entries()].sort((a,b) => b[1]-a[1]).slice(0, limit);
}

export default function AnalyticsDashboard(){
 const [version,setVersion]=useState(0);
 useEffect(()=>{const sync=()=>setVersion(v=>v+1);[ENGAGEMENT_EVENT,GALLERY_ANALYTICS_EVENT,GALLERY_EVENT,"storage"].forEach((event)=>window.addEventListener(event,sync));return()=>[ENGAGEMENT_EVENT,GALLERY_ANALYTICS_EVENT,GALLERY_EVENT,"storage"].forEach((event)=>window.removeEventListener(event,sync))},[]);
 const data=useMemo(()=>{
  const events=readEngagementEvents(); const scraps=readScraps(); const galleryEvents=readGalleryAnalytics(); const gallery=readGalleryItems();
  const counts=new Map<string,{title:string,views:number,scraps:number,shares:number}>();
  events.forEach(e=>{const row=counts.get(e.projectSlug)||{title:e.projectTitle,views:0,scraps:0,shares:0};if(e.type==="view")row.views++;if(e.type==="scrap")row.scraps++;if(e.type==="share")row.shares++;counts.set(e.projectSlug,row)});
  const searches=topCounts(galleryEvents.filter(e=>e.type==="search").map(e=>e.query||""));
  const viewed=topCounts(galleryEvents.filter(e=>e.type==="view").map(e=>e.imageId||""));
  const spaces=topCounts(gallery.flatMap(i=>i.analysis?.space||[])); const styles=topCounts(gallery.flatMap(i=>i.analysis?.styles||[])); const colors=topCounts(gallery.flatMap(i=>i.analysis?.colors||[]));
  return {events,scraps,galleryEvents,gallery,searches,viewed,spaces,styles,colors,top:[...counts.values()].sort((a,b)=>(b.scraps+b.shares+b.views)-(a.scraps+a.shares+a.views)).slice(0,5)};
 },[version]);
 const projectScraps=data.scraps.filter(i=>i.kind==="project").length; const imageScraps=data.scraps.filter(i=>i.kind==="image").length; const shares=data.events.filter(i=>i.type==="share").length;
 const strongest=data.searches[0]?.[0] || data.styles[0]?.[0] || data.spaces[0]?.[0];
 const insight=strongest?`최근 소비자 관심 신호는 “${strongest}”입니다. 관련 GALLERY 이미지와 프로젝트를 우선 노출해 보세요.`:imageScraps>projectScraps?"개별 공간 이미지 저장이 많습니다. 공간별 콘텐츠를 강화해 보세요.":projectScraps?"집 전체 분위기를 저장하는 비율이 높습니다. 대표 이미지와 프로젝트 완성도가 강점입니다.":"데이터가 쌓이면 AI 분석 정보를 기반으로 인기 공간과 스타일을 요약합니다.";
 const renderRanks=(title:string,rows:[string,number][])=><section className="admin-analytics-list"><h2>{title}</h2>{rows.length?rows.map(([label,count],i)=><article key={label}><span>{String(i+1).padStart(2,"0")}</span><strong>{label}</strong><em>{count}회</em></article>):<p>아직 집계할 데이터가 없습니다.</p>}</section>;
 return <><div className="admin-stats"><article><strong>{projectScraps}</strong><span>프로젝트 스크랩</span></article><article><strong>{imageScraps}</strong><span>개별 이미지 스크랩</span></article><article><strong>{shares}</strong><span>공유</span></article><article><strong>{data.galleryEvents.length}</strong><span>Gallery 검색·조회</span></article></div>
 <section className="admin-insight"><h2>AI 소비자 인사이트</h2><p>{insight}</p><small>현재 브라우저에서 수집된 행동 데이터와 Workers AI 이미지 분석 결과 기준입니다.</small></section>
 {renderRanks("Gallery 인기 검색어",data.searches)}{renderRanks("AI 분석 인기 스타일",data.styles)}{renderRanks("AI 분석 인기 공간",data.spaces)}{renderRanks("AI 분석 인기 색상",data.colors)}
 <section className="admin-analytics-list"><h2>관심 프로젝트</h2>{data.top.length?data.top.map((row,i)=><article key={row.title}><span>{String(i+1).padStart(2,"0")}</span><strong>{row.title}</strong><em>스크랩 {row.scraps} · 공유 {row.shares}</em></article>):<p>아직 집계할 데이터가 없습니다.</p>}</section></>;
}
