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

function rank(values, limit = 8) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, count]) => ({ label, count }));
}

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) return json({ ok: false, error: "D1 바인딩 DB가 없습니다." }, 503);
    const db = context.env.DB;
    const [totals, today, month, projects, gallery, searches, analyses, daily] = await Promise.all([
      db.prepare(`SELECT event_type, COUNT(*) count FROM analytics_events GROUP BY event_type`).all(),
      db.prepare(`SELECT COUNT(DISTINCT visitor_id) visitors FROM analytics_events WHERE created_at >= datetime('now','start of day')`).first(),
      db.prepare(`SELECT COUNT(DISTINCT visitor_id) visitors FROM analytics_events WHERE created_at >= datetime('now','start of month')`).first(),
      db.prepare(`SELECT project_slug, views, scraps, shares FROM project_stats ORDER BY (views + scraps * 3 + shares * 2) DESC LIMIT 10`).all(),
      db.prepare(`SELECT gallery_id, views, scraps, shares FROM gallery_stats ORDER BY (views + scraps * 3 + shares * 2) DESC LIMIT 10`).all(),
      db.prepare(`SELECT keyword, count FROM popular_searches ORDER BY count DESC, updated_at DESC LIMIT 10`).all(),
      db.prepare(`SELECT space_type, styles, colors, materials, lighting, keywords FROM gallery_ai_analysis ORDER BY analyzed_at DESC LIMIT 1000`).all(),
      db.prepare(`SELECT substr(created_at,1,10) day, COUNT(*) events, COUNT(DISTINCT visitor_id) visitors FROM analytics_events WHERE created_at >= datetime('now','-13 days') GROUP BY day ORDER BY day ASC`).all(),
    ]);

    const totalMap = Object.fromEntries((totals.results || []).map((row) => [row.event_type, Number(row.count || 0)]));
    const analysisRows = analyses.results || [];
    const spaces = analysisRows.flatMap((row) => safeArray(row.space_type));
    const styles = analysisRows.flatMap((row) => safeArray(row.styles));
    const colors = analysisRows.flatMap((row) => safeArray(row.colors));
    const materials = analysisRows.flatMap((row) => safeArray(row.materials));
    const lighting = analysisRows.flatMap((row) => safeArray(row.lighting));

    return json({
      ok: true,
      totals: {
        visitorsToday: Number(today?.visitors || 0),
        visitorsMonth: Number(month?.visitors || 0),
        views: Number(totalMap.view || 0) + Number(totalMap.gallery_view || 0),
        searches: Number(totalMap.search || 0),
        scraps: Number(totalMap.scrap || 0),
        unscraps: Number(totalMap.unscrap || 0),
        shares: Number(totalMap.share || 0),
      },
      projects: projects.results || [],
      gallery: gallery.results || [],
      searches: searches.results || [],
      trends: {
        spaces: rank(spaces), styles: rank(styles), colors: rank(colors),
        materials: rank(materials), lighting: rank(lighting),
      },
      daily: daily.results || [],
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "통계를 불러오지 못했습니다." }, 500);
  }
}
