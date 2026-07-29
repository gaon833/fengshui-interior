"use client";

import { useEffect, useMemo, useState } from "react";
import { ENGAGEMENT_EVENT, readEngagementEvents, readScraps } from "@/lib/engagement";
import { GALLERY_ANALYTICS_EVENT, readGalleryAnalytics } from "@/lib/gallery-analytics";

type Rank = { label: string; count: number };
type Summary = {
  ok: boolean;
  totals: { visitorsToday:number; visitorsMonth:number; views:number; searches:number; scraps:number; unscraps:number; shares:number };
  projects: Array<{ project_slug:string; views:number; scraps:number; shares:number }>;
  gallery: Array<{ gallery_id:string; views:number; scraps:number; shares:number }>;
  searches: Array<{ keyword:string; count:number }>;
  trends: { spaces:Rank[]; styles:Rank[]; colors:Rank[]; materials:Rank[]; lighting:Rank[] };
  daily: Array<{ day:string; events:number; visitors:number }>;
  generatedAt:string;
};

const empty: Summary = { ok:false, totals:{visitorsToday:0,visitorsMonth:0,views:0,searches:0,scraps:0,unscraps:0,shares:0}, projects:[], gallery:[], searches:[], trends:{spaces:[],styles:[],colors:[],materials:[],lighting:[]}, daily:[], generatedAt:"" };

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<Summary>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localVersion, setLocalVersion] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics/summary", { cache: "no-store" });
      const payload = await response.json() as Summary & { error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "통계를 불러오지 못했습니다.");
      setSummary(payload); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "통계를 불러오지 못했습니다."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const sync = () => setLocalVersion((v) => v + 1);
    [ENGAGEMENT_EVENT, GALLERY_ANALYTICS_EVENT, "storage"].forEach((event) => window.addEventListener(event, sync));
    return () => [ENGAGEMENT_EVENT, GALLERY_ANALYTICS_EVENT, "storage"].forEach((event) => window.removeEventListener(event, sync));
  }, []);

  const local = useMemo(() => ({ scraps: readScraps().length, events: readEngagementEvents().length, gallery: readGalleryAnalytics().length }), [localVersion]);
  const firstSignal = summary.searches[0]?.keyword || summary.trends.styles[0]?.label || summary.trends.spaces[0]?.label;
  const insight = firstSignal
    ? `전체 방문자 데이터에서 “${firstSignal}” 관심도가 가장 높습니다. 관련 프로젝트와 GALLERY 이미지를 우선 노출하는 것을 추천합니다.`
    : "데이터가 쌓이면 검색·조회·스크랩·공유 흐름을 종합해 소비자 관심 방향을 보여줍니다.";

  const renderRanks = (title:string, rows:Rank[]) => <section className="admin-analytics-list"><h2>{title}</h2>{rows.length ? rows.map((row,i)=><article key={row.label}><span>{String(i+1).padStart(2,"0")}</span><strong>{row.label}</strong><em>{row.count}회</em></article>) : <p>아직 집계할 데이터가 없습니다.</p>}</section>;

  return <>
    <div className="admin-analytics-toolbar"><button type="button" className="admin-secondary-button" onClick={() => void load()} disabled={loading}>{loading ? "불러오는 중…" : "통계 새로고침"}</button>{error && <p>{error}</p>}</div>
    <div className="admin-stats">
      <article><strong>{summary.totals.visitorsToday}</strong><span>오늘 방문자</span></article>
      <article><strong>{summary.totals.visitorsMonth}</strong><span>이번 달 방문자</span></article>
      <article><strong>{summary.totals.scraps}</strong><span>전체 스크랩</span></article>
      <article><strong>{summary.totals.shares}</strong><span>전체 공유</span></article>
      <article><strong>{summary.totals.searches}</strong><span>Gallery 검색</span></article>
      <article><strong>{summary.totals.views}</strong><span>콘텐츠 조회</span></article>
    </div>
    <section className="admin-insight"><h2>AI 소비자 인사이트</h2><p>{insight}</p><small>D1에 모인 전체 방문자의 행동 통계와 Workers AI 이미지 분석 결과를 기준으로 합니다.</small></section>
    {renderRanks("Gallery 인기 검색어", summary.searches.map((row)=>({label:row.keyword,count:Number(row.count)})))}
    {renderRanks("AI 분석 인기 스타일", summary.trends.styles)}
    {renderRanks("AI 분석 인기 공간", summary.trends.spaces)}
    {renderRanks("AI 분석 인기 색상", summary.trends.colors)}
    {renderRanks("AI 분석 인기 자재", summary.trends.materials)}
    <section className="admin-analytics-list"><h2>인기 프로젝트</h2>{summary.projects.length ? summary.projects.map((row,i)=><article key={row.project_slug}><span>{String(i+1).padStart(2,"0")}</span><strong>{row.project_slug}</strong><em>조회 {row.views} · 스크랩 {row.scraps} · 공유 {row.shares}</em></article>) : <p>아직 집계할 데이터가 없습니다.</p>}</section>
    <section className="admin-analytics-list"><h2>인기 Gallery 이미지</h2>{summary.gallery.length ? summary.gallery.map((row,i)=><article key={row.gallery_id}><span>{String(i+1).padStart(2,"0")}</span><strong>{row.gallery_id}</strong><em>조회 {row.views} · 스크랩 {row.scraps} · 공유 {row.shares}</em></article>) : <p>아직 집계할 데이터가 없습니다.</p>}</section>
    <section className="admin-insight"><h2>현재 브라우저 기록</h2><p>스크랩 {local.scraps}개 · 프로젝트 행동 {local.events}건 · Gallery 검색·조회 {local.gallery}건</p><small>오프라인이나 서버 전송 실패 시에도 고객의 개인 SCRAP 기능은 계속 동작합니다.</small></section>
  </>;
}
