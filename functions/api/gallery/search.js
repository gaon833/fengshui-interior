const TEXT_MODEL = "@cf/meta/llama-3.1-8b-instruct";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function ensureGalleryTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS gallery_ai_analysis (
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
  )`).run();
}

function parseList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [String(parsed)];
  } catch {
    return String(value).split(/[,/|]/).map((item) => item.trim()).filter(Boolean);
  }
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^0-9a-zA-Z가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SYNONYMS = [
  ["거실", "리빙", "리빙룸", "living", "livingroom"],
  ["주방", "키친", "부엌", "kitchen"],
  ["욕실", "화장실", "배스룸", "bathroom", "bath"],
  ["침실", "방", "베드룸", "bedroom"],
  ["현관", "입구", "엔트런스", "entrance", "entry"],
  ["화이트", "흰색", "아이보리", "크림", "오프화이트", "white", "ivory"],
  ["아이보리", "크림", "오프화이트", "화이트", "베이지", "ivory", "cream"],
  ["베이지", "웜베이지", "크림", "아이보리", "beige", "warm"],
  ["우드", "나무", "오크", "월넛", "wood", "oak", "walnut"],
  ["호텔", "호텔식", "럭셔리", "고급", "부티크", "hotel", "luxury"],
  ["미니멀", "심플", "모던", "깔끔", "minimal", "modern"],
  ["간접조명", "무드조명", "라인조명", "조명", "lighting", "light"],
  ["대리석", "스톤", "석재", "마블", "marble", "stone"],
  ["따뜻한", "포근한", "웜", "아늑한", "warm", "cozy"],
  ["밝은", "환한", "화이트", "아이보리", "bright"],
];

function fallbackTerms(query) {
  const base = normalize(query).split(" ").filter(Boolean);
  const expanded = new Set(base);
  for (const term of base) {
    for (const group of SYNONYMS) {
      const normalizedGroup = group.map(normalize);
      if (normalizedGroup.some((item) => item.includes(term) || term.includes(item))) {
        normalizedGroup.forEach((item) => expanded.add(item));
      }
    }
  }
  return [...expanded].slice(0, 30);
}

function extractJson(text) {
  const cleaned = String(text || "").replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("JSON 결과 없음");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function expandWithAI(ai, query) {
  const fallback = fallbackTerms(query);
  if (!ai) return { terms: fallback, usedAI: false };
  try {
    const prompt = `인테리어 이미지 검색어를 분석하세요. 사용자의 검색 의도와 의미가 가까운 한국어 표현을 확장하되 지나치게 넓히지 마세요. 반드시 JSON 객체 하나만 반환하세요.\n검색어: ${query}\n형식: {"terms":["원문 핵심어","유사 색상","유사 공간","유사 스타일"]}\n최대 20개, 중복 금지.`;
    const result = await ai.run(TEXT_MODEL, {
      messages: [
        { role: "system", content: "당신은 인테리어 이미지 의미 검색용 한국어 질의 확장기입니다." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 350,
    });
    const raw = result?.response || result?.answer || result;
    const parsed = extractJson(raw);
    const aiTerms = Array.isArray(parsed?.terms) ? parsed.terms.map(normalize).filter(Boolean) : [];
    return { terms: [...new Set([...fallback, ...aiTerms])].slice(0, 36), usedAI: aiTerms.length > 0 };
  } catch {
    return { terms: fallback, usedAI: false };
  }
}

function scoreRow(row, query, terms) {
  const fields = {
    description: normalize(row.description),
    space: parseList(row.space_type).map(normalize),
    styles: parseList(row.styles).map(normalize),
    colors: parseList(row.colors).map(normalize),
    materials: parseList(row.materials).map(normalize),
    features: parseList(row.lighting).map(normalize),
    keywords: parseList(row.keywords).map(normalize),
  };
  const exactQuery = normalize(query);
  const all = normalize([
    fields.description,
    ...fields.space,
    ...fields.styles,
    ...fields.colors,
    ...fields.materials,
    ...fields.features,
    ...fields.keywords,
  ].join(" "));

  let score = 0;
  const matched = new Set();
  if (exactQuery && all.includes(exactQuery)) score += 80;
  for (const term of terms) {
    if (!term) continue;
    let termScore = 0;
    if (fields.space.some((value) => value === term || value.includes(term) || term.includes(value))) termScore = Math.max(termScore, 24);
    if (fields.colors.some((value) => value === term || value.includes(term) || term.includes(value))) termScore = Math.max(termScore, 22);
    if (fields.styles.some((value) => value === term || value.includes(term) || term.includes(value))) termScore = Math.max(termScore, 20);
    if (fields.materials.some((value) => value === term || value.includes(term) || term.includes(value))) termScore = Math.max(termScore, 18);
    if (fields.features.some((value) => value === term || value.includes(term) || term.includes(value))) termScore = Math.max(termScore, 16);
    if (fields.keywords.some((value) => value.includes(term) || term.includes(value))) termScore = Math.max(termScore, 14);
    if (fields.description.includes(term)) termScore = Math.max(termScore, 10);
    if (termScore > 0) {
      score += termScore;
      matched.add(term);
    }
  }
  score += Math.min(matched.size * 4, 24);
  return { score, matchedTerms: [...matched].slice(0, 12) };
}

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) return json({ ok: false, error: "D1 바인딩 DB가 없습니다." }, 503);
    await ensureGalleryTable(context.env.DB);
    const body = await context.request.json();
    const query = String(body?.query || "").trim().slice(0, 120);
    const galleryIds = Array.isArray(body?.galleryIds)
      ? [...new Set(body.galleryIds.map((id) => String(id).trim()).filter(Boolean))].slice(0, 500)
      : [];
    if (!query) return json({ ok: true, query: "", terms: [], results: [], usedAI: false });
    if (!galleryIds.length) return json({ ok: true, query, terms: fallbackTerms(query), results: [], usedAI: false });

    const placeholders = galleryIds.map(() => "?").join(",");
    const rows = await context.env.DB.prepare(
      `SELECT gallery_id, description, space_type, styles, colors, materials, lighting, keywords
       FROM gallery_ai_analysis
       WHERE analysis_status = 'ready' AND gallery_id IN (${placeholders})`
    ).bind(...galleryIds).all();

    const expansion = await expandWithAI(context.env.AI, query);
    const results = (rows.results || [])
      .map((row) => ({ galleryId: row.gallery_id, ...scoreRow(row, query, expansion.terms) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 120);

    return json({ ok: true, query, terms: expansion.terms, results, usedAI: expansion.usedAI });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "AI 검색에 실패했습니다." }, 500);
  }
}
