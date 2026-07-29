import { ensureAdminTables, json as authJson, validateSession } from "../../_shared/admin-auth.js";

const MODEL = "@cf/moondream/moondream3.1-9B-A2B";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function ensureGalleryTables(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS gallery_ai_analysis (
      gallery_id TEXT PRIMARY KEY,
      description TEXT,
      space_type TEXT,
      styles TEXT,
      colors TEXT,
      materials TEXT,
      lighting TEXT,
      keywords TEXT,
      raw_result TEXT,
      analysis_status TEXT NOT NULL DEFAULT 'ready',
      model TEXT,
      error_message TEXT,
      analyzed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);
  const columns = await db.prepare("PRAGMA table_info(gallery_ai_analysis)").all();
  const names = new Set((columns.results || []).map((row) => row.name));
  const migrations = [];
  if (!names.has("analysis_status")) migrations.push(db.prepare("ALTER TABLE gallery_ai_analysis ADD COLUMN analysis_status TEXT NOT NULL DEFAULT 'ready'"));
  if (!names.has("model")) migrations.push(db.prepare("ALTER TABLE gallery_ai_analysis ADD COLUMN model TEXT"));
  if (!names.has("error_message")) migrations.push(db.prepare("ALTER TABLE gallery_ai_analysis ADD COLUMN error_message TEXT"));
  if (migrations.length) await db.batch(migrations);
}

function validateDataUrl(dataUrl) {
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(dataUrl || "")) {
    throw new Error("PNG, JPG, WEBP 이미지만 분석할 수 있습니다.");
  }
  if (dataUrl.length > 8_000_000) throw new Error("AI 분석용 이미지가 너무 큽니다. 다시 업로드해 주세요.");
  return dataUrl;
}

function extractJson(text) {
  const cleaned = String(text || "").replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI가 JSON 분석 결과를 반환하지 않았습니다.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function list(value, max = 8) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,/|]/) : [];
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))].slice(0, max);
}

function normalizeAnalysis(value) {
  const caption = String(value?.caption || value?.description || "인테리어 공간 이미지").trim().slice(0, 500);
  const space = list(value?.space || value?.spaces);
  const styles = list(value?.styles || value?.style);
  const colors = list(value?.colors || value?.color);
  const materials = list(value?.materials || value?.material);
  const features = list(value?.features || value?.lighting || value?.objects, 12);
  const keywords = list(value?.keywords, 16);
  return { caption, space, styles, colors, materials, features, keywords };
}

async function requireAdmin(context) {
  if (!context.env.DB) return { response: json({ ok: false, error: "D1 바인딩 DB가 없습니다." }, 503) };
  await ensureAdminTables(context.env.DB);
  const session = await validateSession(context.env.DB, context.request);
  if (!session) return { response: authJson({ ok: false, error: "관리자 로그인이 만료되었습니다." }, 401) };
  return { session };
}

export async function onRequestGet(context) {
  try {
    const auth = await requireAdmin(context);
    if (auth.response) return auth.response;
    await ensureGalleryTables(context.env.DB);
    const galleryId = new URL(context.request.url).searchParams.get("galleryId")?.trim();
    if (!galleryId) return json({ ok: true, model: MODEL, aiBound: Boolean(context.env.AI), dbBound: true });
    const row = await context.env.DB.prepare("SELECT * FROM gallery_ai_analysis WHERE gallery_id = ?").bind(galleryId).first();
    return json({ ok: true, analysis: row || null, model: MODEL, aiBound: Boolean(context.env.AI), dbBound: true });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "AI 상태 확인에 실패했습니다." }, 500);
  }
}

export async function onRequestPost(context) {
  let galleryId = "";
  try {
    const auth = await requireAdmin(context);
    if (auth.response) return auth.response;
    if (!context.env.AI) return json({ ok: false, error: "Workers AI 바인딩 이름이 AI인지 확인해 주세요." }, 503);
    await ensureGalleryTables(context.env.DB);

    const body = await context.request.json();
    galleryId = typeof body?.galleryId === "string" ? body.galleryId.trim().slice(0, 180) : "";
    if (!galleryId) return json({ ok: false, error: "갤러리 이미지 ID가 없습니다." }, 400);
    const image = validateDataUrl(body?.image);

    await context.env.DB.prepare(`INSERT INTO gallery_ai_analysis
      (gallery_id, analysis_status, model, analyzed_at)
      VALUES (?, 'analyzing', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(gallery_id) DO UPDATE SET analysis_status='analyzing', model=excluded.model, error_message=NULL, analyzed_at=CURRENT_TIMESTAMP`)
      .bind(galleryId, MODEL).run();

    const prompt = `당신은 인테리어 사진 검색용 분석기입니다. 사진에 실제로 보이는 내용만 한국어로 분석하고 반드시 JSON 객체 하나만 반환하세요.
{
  "caption":"공간·색상·재료·분위기가 포함된 검색용 한 문장",
  "space":["거실"],
  "styles":["모던","미니멀"],
  "colors":["아이보리","베이지"],
  "materials":["우드","대리석"],
  "features":["간접조명","아일랜드"],
  "keywords":["아이보리 거실","따뜻한 우드 인테리어","호텔 느낌"]
}
규칙: 배열은 중복 없이 구체적인 한국어 단어로 작성하고, 보이지 않는 평형·지역·브랜드는 추측하지 마세요.`;

    const result = await context.env.AI.run(MODEL, {
      task: "query",
      image,
      question: prompt,
      reasoning: false,
      stream: false,
      max_tokens: 1200,
      temperature: 0.1,
    });
    const rawText = result?.answer || result?.response || result?.caption || result;
    const analysis = normalizeAnalysis(extractJson(rawText));

    await context.env.DB.prepare(`INSERT INTO gallery_ai_analysis
      (gallery_id, description, space_type, styles, colors, materials, lighting, keywords, raw_result, analysis_status, model, error_message, analyzed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?, NULL, CURRENT_TIMESTAMP)
      ON CONFLICT(gallery_id) DO UPDATE SET
        description=excluded.description, space_type=excluded.space_type, styles=excluded.styles,
        colors=excluded.colors, materials=excluded.materials, lighting=excluded.lighting,
        keywords=excluded.keywords, raw_result=excluded.raw_result, analysis_status='ready',
        model=excluded.model, error_message=NULL, analyzed_at=CURRENT_TIMESTAMP`)
      .bind(galleryId, analysis.caption, JSON.stringify(analysis.space), JSON.stringify(analysis.styles),
        JSON.stringify(analysis.colors), JSON.stringify(analysis.materials), JSON.stringify(analysis.features),
        JSON.stringify(analysis.keywords), JSON.stringify(analysis), MODEL).run();

    return json({ ok: true, analysis, model: MODEL, galleryId, storedInD1: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 분석에 실패했습니다.";
    try {
      if (galleryId && context.env.DB) {
        await ensureGalleryTables(context.env.DB);
        await context.env.DB.prepare(`INSERT INTO gallery_ai_analysis
          (gallery_id, analysis_status, model, error_message, analyzed_at)
          VALUES (?, 'failed', ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(gallery_id) DO UPDATE SET analysis_status='failed', model=excluded.model, error_message=excluded.error_message, analyzed_at=CURRENT_TIMESTAMP`)
          .bind(galleryId, MODEL, message.slice(0, 1000)).run();
      }
    } catch {}
    return json({ ok: false, error: message, galleryId, storedInD1: false }, 500);
  }
}
