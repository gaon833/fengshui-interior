function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function safeArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch { return []; }
}

function count(values, limit = 8) {
  const map = new Map();
  for (const value of values) {
    const key = String(value || "").trim();
    if (key) map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, count: value }));
}

function fallback(payload) {
  const topSearch = payload.searches[0]?.keyword;
  const topStyle = payload.trends.styles[0]?.label;
  const topSpace = payload.trends.spaces[0]?.label;
  const topColor = payload.trends.colors[0]?.label;
  const focus = [topColor, topStyle, topSpace].filter(Boolean).join(" + ");
  const headline = topSearch
    ? `최근 고객은 “${topSearch}” 관련 이미지를 가장 많이 찾고 있습니다.`
    : focus
      ? `${focus} 조합의 관심 신호가 가장 뚜렷합니다.`
      : "아직 충분한 소비자 행동 데이터가 쌓이지 않았습니다.";
  return {
    headline,
    summary: payload.totals.events > 0
      ? `조회·검색·스크랩·공유 ${payload.totals.events}건을 기준으로 분석했습니다.`
      : "검색·조회·스크랩 데이터가 쌓이면 더 정확한 분석이 제공됩니다.",
    opportunities: [
      focus ? `${focus} 계열의 GALLERY 이미지를 우선 업로드하세요.` : "GALLERY 이미지를 꾸준히 추가해 검색 데이터를 확보하세요.",
      topSearch ? `“${topSearch}” 검색과 연결되는 프로젝트를 메인에 노출하세요.` : "스크랩률이 높은 프로젝트를 메인 후보로 활용하세요.",
      "가로·세로 사진을 함께 올려 고객이 공간 전체와 디테일을 모두 비교할 수 있게 하세요.",
    ],
    cautions: payload.totals.searches > 0 && payload.totals.scraps === 0
      ? ["검색은 발생하지만 스크랩 전환이 낮습니다. 검색 결과의 첫 이미지 품질을 점검하세요."]
      : ["짧은 기간의 데이터만으로 스타일 유행을 단정하지 말고 2~4주 흐름을 함께 확인하세요."],
    mainRecommendation: payload.projects[0]
      ? { type: "project", id: payload.projects[0].project_slug, reason: "조회·스크랩·공유를 합산한 관심 점수가 가장 높습니다." }
      : payload.gallery[0]
        ? { type: "gallery", id: payload.gallery[0].gallery_id, reason: "현재 GALLERY 관심 점수가 가장 높습니다." }
        : null,
    contentPlan: [
      { title: focus || topSearch || "대표 스타일", action: "비슷한 톤의 거실·주방·욕실 이미지를 3~5장 추가" },
      { title: topSpace || "공간별 콘텐츠", action: "전체 컷 1장과 디테일 컷 2장을 함께 구성" },
    ],
    confidence: payload.totals.events >= 100 ? "high" : payload.totals.events >= 20 ? "medium" : "low",
    source: "fallback",
  };
}

async function collect(db) {
  const [events, projects, gallery, searches, analyses, recent, previous] = await Promise.all([
    db.prepare(`SELECT event_type, COUNT(*) count FROM analytics_events GROUP BY event_type`).all(),
    db.prepare(`SELECT project_slug, views, scraps, shares FROM project_stats ORDER BY (views + scraps * 3 + shares * 2) DESC LIMIT 10`).all(),
    db.prepare(`SELECT gallery_id, views, scraps, shares FROM gallery_stats ORDER BY (views + scraps * 3 + shares * 2) DESC LIMIT 10`).all(),
    db.prepare(`SELECT keyword, count FROM popular_searches ORDER BY count DESC, updated_at DESC LIMIT 15`).all(),
    db.prepare(`SELECT space_type, styles, colors, materials, lighting, keywords FROM gallery_ai_analysis ORDER BY analyzed_at DESC LIMIT 1000`).all(),
    db.prepare(`SELECT event_type, COUNT(*) count FROM analytics_events WHERE created_at >= datetime('now','-7 days') GROUP BY event_type`).all(),
    db.prepare(`SELECT event_type, COUNT(*) count FROM analytics_events WHERE created_at >= datetime('now','-14 days') AND created_at < datetime('now','-7 days') GROUP BY event_type`).all(),
  ]);
  const eventMap = Object.fromEntries((events.results || []).map((r) => [r.event_type, Number(r.count || 0)]));
  const recentMap = Object.fromEntries((recent.results || []).map((r) => [r.event_type, Number(r.count || 0)]));
  const previousMap = Object.fromEntries((previous.results || []).map((r) => [r.event_type, Number(r.count || 0)]));
  const rows = analyses.results || [];
  const trend = (field) => count(rows.flatMap((row) => safeArray(row[field])));
  const totalEvents = Object.values(eventMap).reduce((a, b) => a + Number(b || 0), 0);
  return {
    totals: {
      events: totalEvents,
      views: Number(eventMap.view || 0) + Number(eventMap.gallery_view || 0),
      searches: Number(eventMap.search || 0),
      scraps: Number(eventMap.scrap || 0),
      shares: Number(eventMap.share || 0),
    },
    week: { current: recentMap, previous: previousMap },
    projects: projects.results || [],
    gallery: gallery.results || [],
    searches: searches.results || [],
    trends: {
      spaces: trend("space_type"), styles: trend("styles"), colors: trend("colors"),
      materials: trend("materials"), lighting: trend("lighting"), keywords: trend("keywords"),
    },
  };
}

function parseModel(result) {
  const response = result?.response ?? result;
  const text = typeof response === "string" ? response : JSON.stringify(response || {});
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI 응답을 해석하지 못했습니다.");
  return JSON.parse(match[0]);
}

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) return json({ ok: false, error: "D1 바인딩 DB가 없습니다." }, 503);
    const payload = await collect(context.env.DB);
    const basic = fallback(payload);
    if (!context.env.AI || payload.totals.events < 5) {
      return json({ ok: true, insight: basic, generatedAt: new Date().toISOString() });
    }

    const prompt = `당신은 한국 인테리어 포트폴리오 사이트의 소비자 행동 분석가입니다.
아래 데이터만 근거로 관리자에게 실용적인 운영 제안을 한국어로 작성하세요.
과장하거나 존재하지 않는 수치를 만들지 마세요. 데이터가 적으면 확신이 낮다고 명시하세요.
반드시 JSON 하나만 반환하세요.
형식:
{
  "headline":"한 문장 핵심 인사이트",
  "summary":"2문장 이내 분석 요약",
  "opportunities":["실행 제안 1","실행 제안 2","실행 제안 3"],
  "cautions":["주의점 1"],
  "mainRecommendation":{"type":"project 또는 gallery","id":"식별자","reason":"추천 이유"} 또는 null,
  "contentPlan":[{"title":"콘텐츠 주제","action":"구체적인 업로드 계획"}],
  "confidence":"low 또는 medium 또는 high"
}
데이터:
${JSON.stringify(payload)}`;

    let result;
    const models = ["@cf/meta/llama-3.1-8b-instruct", "@cf/meta/llama-3.2-3b-instruct"];
    let lastError;
    for (const model of models) {
      try {
        result = await context.env.AI.run(model, { prompt, max_tokens: 900, temperature: 0.25 });
        if (result) break;
      } catch (error) { lastError = error; }
    }
    if (!result) throw lastError || new Error("AI 분석을 실행하지 못했습니다.");
    const parsed = parseModel(result);
    const insight = {
      headline: String(parsed.headline || basic.headline),
      summary: String(parsed.summary || basic.summary),
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.slice(0, 5).map(String) : basic.opportunities,
      cautions: Array.isArray(parsed.cautions) ? parsed.cautions.slice(0, 3).map(String) : basic.cautions,
      mainRecommendation: parsed.mainRecommendation && typeof parsed.mainRecommendation === "object" ? parsed.mainRecommendation : basic.mainRecommendation,
      contentPlan: Array.isArray(parsed.contentPlan) ? parsed.contentPlan.slice(0, 5) : basic.contentPlan,
      confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : basic.confidence,
      source: "workers-ai",
    };
    return json({ ok: true, insight, generatedAt: new Date().toISOString() });
  } catch (error) {
    try {
      const payload = context.env.DB ? await collect(context.env.DB) : null;
      if (payload) return json({ ok: true, insight: fallback(payload), warning: error instanceof Error ? error.message : "AI 분석 실패", generatedAt: new Date().toISOString() });
    } catch {}
    return json({ ok: false, error: error instanceof Error ? error.message : "AI 인사이트를 생성하지 못했습니다." }, 500);
  }
}
