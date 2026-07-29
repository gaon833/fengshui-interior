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

function validateDataUrl(dataUrl) {
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(dataUrl || "")) {
    throw new Error("지원하지 않는 이미지 형식입니다.");
  }
  return dataUrl;
}

function extractJson(text) {
  const cleaned = String(text || "").replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI 응답을 해석하지 못했습니다.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function onRequestPost(context) {
  try {
    if (!context.env.AI) return json({ ok: false, error: "Workers AI 바인딩 AI가 없습니다." }, 503);
    const body = await context.request.json();
    if (!body?.image) return json({ ok: false, error: "이미지가 없습니다." }, 400);

    const prompt = `이 인테리어 사진을 한국어로 분석하세요. 반드시 JSON 객체만 반환하세요.
형식:
{
  "caption": "검색에 유용한 자연스러운 한 문장 설명",
  "space": ["거실"],
  "styles": ["미니멀", "화이트"],
  "colors": ["화이트", "베이지"],
  "materials": ["우드", "대리석"],
  "features": ["간접조명", "아일랜드"],
  "keywords": ["화이트 주방", "따뜻한 우드", "호텔 느낌"]
}
규칙: 보이지 않는 요소는 추측하지 말고, 각 배열은 최대 8개, 중복 없이 간결하게 작성하세요.`;

    const result = await context.env.AI.run(MODEL, {
      task: "query",
      image: validateDataUrl(body.image),
      question: prompt,
      reasoning: false,
      stream: false,
      max_tokens: 1200,
      temperature: 0.1,
    });
    const parsed = extractJson(result?.answer || result?.response || result);
    return json({ ok: true, analysis: parsed, model: MODEL });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "AI 분석에 실패했습니다." }, 500);
  }
}
