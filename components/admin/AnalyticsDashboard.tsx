"use client";
import { useEffect,useMemo,useState } from "react";
import { ENGAGEMENT_EVENT, readEngagementEvents, readScraps } from "@/lib/engagement";
export default function AnalyticsDashboard(){
 const [version,setVersion]=useState(0);
 useEffect(()=>{const sync=()=>setVersion(v=>v+1);window.addEventListener("storage",sync);window.addEventListener(ENGAGEMENT_EVENT,sync);return()=>{window.removeEventListener("storage",sync);window.removeEventListener(ENGAGEMENT_EVENT,sync)}},[]);
 const data=useMemo(()=>{
  const events=readEngagementEvents(); const scraps=readScraps();
  const counts=new Map<string,{title:string,views:number,scraps:number,shares:number}>();
  events.forEach(e=>{const row=counts.get(e.projectSlug)||{title:e.projectTitle,views:0,scraps:0,shares:0};if(e.type==="view")row.views++;if(e.type==="scrap")row.scraps++;if(e.type==="share")row.shares++;counts.set(e.projectSlug,row)});
  return {events,scraps,top:[...counts.values()].sort((a,b)=>(b.scraps+b.shares+b.views)-(a.scraps+a.shares+a.views)).slice(0,5)};
 },[version]);
 const projectScraps=data.scraps.filter(i=>i.kind==="project").length; const imageScraps=data.scraps.filter(i=>i.kind==="image").length; const shares=data.events.filter(i=>i.type==="share").length;
 const insight=imageScraps>projectScraps?"개별 공간 이미지 저장이 많습니다. 주방·거실처럼 공간별 콘텐츠를 강화해 보세요.":projectScraps?"집 전체 분위기를 저장하는 비율이 높습니다. 대표 이미지와 프로젝트 완성도가 강점입니다.":"스크랩 데이터가 쌓이면 인기 공간과 프로젝트를 분석해 드립니다.";
 return <><div className="admin-stats"><article><strong>{projectScraps}</strong><span>프로젝트 스크랩</span></article><article><strong>{imageScraps}</strong><span>개별 이미지 스크랩</span></article><article><strong>{shares}</strong><span>공유</span></article><article><strong>{data.events.length}</strong><span>행동 기록</span></article></div>
 <section className="admin-insight"><h2>소비자 인사이트</h2><p>{insight}</p><small>현재 브라우저에서 수집된 테스트 데이터 기준입니다.</small></section>
 <section className="admin-analytics-list"><h2>관심 프로젝트</h2>{data.top.length?data.top.map((row,i)=><article key={row.title}><span>{String(i+1).padStart(2,"0")}</span><strong>{row.title}</strong><em>스크랩 {row.scraps} · 공유 {row.shares}</em></article>):<p>아직 집계할 데이터가 없습니다.</p>}</section></>;
}
