function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

const ALLOWED = new Set(["visit", "view", "gallery_view", "search", "scrap", "unscrap", "share"]);

function text(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) return json({ ok: false, error: "D1 바인딩 DB가 없습니다." }, 503);
    const body = await context.request.json();
    const eventType = text(body?.eventType, 40);
    if (!ALLOWED.has(eventType)) return json({ ok: false, error: "지원하지 않는 이벤트입니다." }, 400);

    const visitorId = text(body?.visitorId, 120);
    const projectSlug = text(body?.projectSlug, 180);
    const galleryId = text(body?.galleryId, 180);
    const imageId = text(body?.imageId, 240);
    const searchQuery = text(body?.searchQuery, 240);
    const metadata = JSON.stringify(body?.metadata && typeof body.metadata === "object" ? body.metadata : {});

    const statements = [
      context.env.DB.prepare(`
        INSERT INTO analytics_events
          (event_type, visitor_id, project_slug, gallery_id, image_id, search_query, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(eventType, visitorId || null, projectSlug || null, galleryId || null, imageId || null, searchQuery || null, metadata),
    ];

    if (projectSlug && ["view", "scrap", "unscrap", "share"].includes(eventType)) {
      const views = eventType === "view" ? 1 : 0;
      const scraps = eventType === "scrap" ? 1 : eventType === "unscrap" ? -1 : 0;
      const shares = eventType === "share" ? 1 : 0;
      statements.push(context.env.DB.prepare(`
        INSERT INTO project_stats (project_slug, views, scraps, shares, updated_at)
        VALUES (?, ?, MAX(0, ?), ?, CURRENT_TIMESTAMP)
        ON CONFLICT(project_slug) DO UPDATE SET
          views = project_stats.views + excluded.views,
          scraps = MAX(0, project_stats.scraps + ?),
          shares = project_stats.shares + excluded.shares,
          updated_at = CURRENT_TIMESTAMP
      `).bind(projectSlug, views, scraps, shares, scraps));
    }

    const effectiveGalleryId = galleryId || (eventType === "gallery_view" ? imageId : "");
    if (effectiveGalleryId && ["gallery_view", "scrap", "unscrap", "share"].includes(eventType)) {
      const views = eventType === "gallery_view" ? 1 : 0;
      const scraps = eventType === "scrap" ? 1 : eventType === "unscrap" ? -1 : 0;
      const shares = eventType === "share" ? 1 : 0;
      statements.push(context.env.DB.prepare(`
        INSERT INTO gallery_stats (gallery_id, views, scraps, shares, updated_at)
        VALUES (?, ?, MAX(0, ?), ?, CURRENT_TIMESTAMP)
        ON CONFLICT(gallery_id) DO UPDATE SET
          views = gallery_stats.views + excluded.views,
          scraps = MAX(0, gallery_stats.scraps + ?),
          shares = gallery_stats.shares + excluded.shares,
          updated_at = CURRENT_TIMESTAMP
      `).bind(effectiveGalleryId, views, scraps, shares, scraps));
    }

    if (eventType === "search" && searchQuery) {
      statements.push(context.env.DB.prepare(`
        INSERT INTO popular_searches (keyword, count, updated_at)
        VALUES (?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(keyword) DO UPDATE SET
          count = popular_searches.count + 1,
          updated_at = CURRENT_TIMESTAMP
      `).bind(searchQuery));
    }

    await context.env.DB.batch(statements);
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "통계 저장에 실패했습니다." }, 500);
  }
}
