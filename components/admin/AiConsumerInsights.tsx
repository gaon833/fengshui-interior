"use client";

import { useEffect, useState } from "react";

type Insight = {
  headline: string;
  summary: string;
  opportunities: string[];
  cautions: string[];
  mainRecommendation: { type:string; id:string; reason:string } | null;
  contentPlan: Array<{ title:string; action:string }>;
  confidence: "low" | "medium" | "high";
  source: "workers-ai" | "fallback";
};

type ResponseData = { ok:boolean; insight?:Insight; warning?:string; error?:string; generatedAt?:string };

const confidenceLabel = { low:"데이터 축적 중", medium:"중간 신뢰도", high:"높은 신뢰도" } as const;

export default function AiConsumerInsights() {
  const [data, setData] = useState<ResponseData>({ ok:false });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics/insights", { cache:"no-store" });
      const payload = await response.json() as ResponseData;
      setData(payload);
    } catch (error) {
      setData({ ok:false, error:error instanceof Error ? error.message : "AI 인사이트를 불러오지 못했습니다." });
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <section className="admin-insight admin-ai-decision"><h2>AI 운영 인사이트</h2><p>전체 소비자 데이터를 분석하고 있습니다…</p></section>;
  if (!data.ok || !data.insight) return <section className="admin-insight admin-ai-decision"><h2>AI 운영 인사이트</h2><p>{data.error || "인사이트를 불러오지 못했습니다."}</p><button type="button" className="admin-secondary-button" onClick={() => void load()}>다시 분석</button></section>;

  const insight = data.insight;
  return <section className="admin-ai-decision">
    <header>
      <div><span className="admin-ai-kicker">AI CONSUMER INSIGHT</span><h2>{insight.headline}</h2></div>
      <button type="button" className="admin-secondary-button" onClick={() => void load()}>다시 분석</button>
    </header>
    <p className="admin-ai-summary">{insight.summary}</p>
    <div className="admin-ai-meta"><span>{confidenceLabel[insight.confidence]}</span><span>{insight.source === "workers-ai" ? "Workers AI 분석" : "규칙 기반 안전 분석"}</span></div>
    {insight.mainRecommendation && <article className="admin-ai-main-recommendation"><small>메인 노출 추천</small><strong>{insight.mainRecommendation.id}</strong><p>{insight.mainRecommendation.reason}</p></article>}
    <div className="admin-ai-columns">
      <div><h3>지금 실행할 일</h3>{insight.opportunities.map((item, index)=><p key={`${item}-${index}`}><b>{String(index+1).padStart(2,"0")}</b>{item}</p>)}</div>
      <div><h3>주의해서 볼 점</h3>{insight.cautions.map((item, index)=><p key={`${item}-${index}`}><b>—</b>{item}</p>)}</div>
    </div>
    <div className="admin-ai-content-plan"><h3>다음 콘텐츠 제안</h3>{insight.contentPlan.map((item,index)=><article key={`${item.title}-${index}`}><strong>{item.title}</strong><span>{item.action}</span></article>)}</div>
    {data.warning && <small className="admin-ai-warning">Workers AI 응답이 불안정해 안전 분석으로 표시했습니다: {data.warning}</small>}
  </section>;
}
