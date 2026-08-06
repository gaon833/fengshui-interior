export async function ensureCmsContentTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS cms_content (
    content_key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
}

export async function getCmsContent(db, key) {
  const row = await db.prepare("SELECT data FROM cms_content WHERE content_key = ?").bind(String(key)).first();
  if (!row?.data) return null;
  try { return JSON.parse(row.data); } catch { return null; }
}

export async function setCmsContent(db, key, value) {
  await db.prepare(`INSERT INTO cms_content (content_key, data, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(content_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`)
    .bind(String(key), JSON.stringify(value), Date.now()).run();
}

function safeSegment(value) {
  return String(value || "media").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "media";
}

function decodeDataUrl(value) {
  if (typeof value !== "string" || !value.startsWith("data:image/")) return null;
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) throw new Error("지원하지 않는 이미지 데이터입니다.");
  const mime = match[1].toLowerCase();
  const allowed = new Set(["image/webp", "image/jpeg", "image/png", "image/gif"]);
  if (!allowed.has(mime)) throw new Error("지원하지 않는 이미지 형식입니다.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  return { mime, bytes, ext };
}

export async function materializeImage(bucket, value, namespace, label) {
  const decoded = decodeDataUrl(value);
  if (!decoded) return value || "";
  if (!bucket) throw new Error("R2 바인딩 PROJECT_MEDIA가 없습니다.");
  const key = `${safeSegment(namespace)}--${safeSegment(label)}--${crypto.randomUUID()}.${decoded.ext}`;
  await bucket.put(key, decoded.bytes, { httpMetadata: { contentType: decoded.mime, cacheControl: "public, max-age=31536000, immutable" } });
  return `/api/project-media/${encodeURIComponent(key)}`;
}

export async function materializeKnownImages(bucket, key, value) {
  const next = structuredClone(value);
  if (key === "site") {
    for (const field of ["logo", "mainImage", "mobileMainImage"]) if (next[field]) next[field] = await materializeImage(bucket, next[field], "site", field);
    if (next.seo?.ogImage) next.seo.ogImage = await materializeImage(bucket, next.seo.ogImage, "site", "og");
    if (next.seo?.favicon) next.seo.favicon = await materializeImage(bucket, next.seo.favicon, "site", "favicon");
  } else if (key === "story" && next.image) {
    next.image = await materializeImage(bucket, next.image, "page", "story");
  } else if (key === "process" && next.image) {
    next.image = await materializeImage(bucket, next.image, "page", "process");
  }
  return next;
}

export function managedMediaKey(value) {
  if (typeof value !== "string" || !value.startsWith("/api/project-media/")) return null;
  try { return decodeURIComponent(value.slice("/api/project-media/".length)); } catch { return null; }
}

export async function deleteManagedImage(bucket, value) {
  const key = managedMediaKey(value);
  if (bucket && key) await bucket.delete(key);
}

export async function cleanupReplacedContentImages(bucket, key, previous, next) {
  if (!previous || !bucket) return;
  const pairs = [];
  if (key === "site") {
    for (const field of ["logo", "mainImage", "mobileMainImage"]) pairs.push([previous?.[field], next?.[field]]);
    pairs.push([previous?.seo?.ogImage, next?.seo?.ogImage], [previous?.seo?.favicon, next?.seo?.favicon]);
  } else if (key === "story" || key === "process") pairs.push([previous?.image, next?.image]);
  for (const [oldValue, newValue] of pairs) if (oldValue && oldValue !== newValue) await deleteManagedImage(bucket, oldValue);
}
