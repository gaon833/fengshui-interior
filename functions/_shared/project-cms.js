export async function ensureProjectCmsTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS cms_projects (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    status TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_cms_projects_status ON cms_projects(status)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_cms_projects_slug ON cms_projects(slug)").run();
}

function safeId(value) {
  return String(value || "project").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "project";
}

function decodeDataUrl(value) {
  if (typeof value !== "string" || !value.startsWith("data:image/")) return null;
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
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

async function storeImage(bucket, projectId, value, label) {
  const decoded = decodeDataUrl(value);
  if (!decoded) return value || "";
  if (!bucket) throw new Error("R2 바인딩 PROJECT_MEDIA가 없습니다.");
  const token = crypto.randomUUID();
  const key = `${safeId(projectId)}--${safeId(label)}--${token}.${decoded.ext}`;
  await bucket.put(key, decoded.bytes, {
    httpMetadata: { contentType: decoded.mime, cacheControl: "public, max-age=31536000, immutable" },
  });
  return `/api/project-media/${encodeURIComponent(key)}`;
}

export async function materializeProjectImages(bucket, project) {
  const next = structuredClone(project);
  const originalCover = next.coverImage;
  next.coverImage = await storeImage(bucket, next.id, originalCover, "cover");
  if (next.mobileCoverImage) next.mobileCoverImage = await storeImage(bucket, next.id, next.mobileCoverImage, "mobile-cover");
  if (next.seo?.ogImage) next.seo.ogImage = next.seo.ogImage === originalCover ? next.coverImage : await storeImage(bucket, next.id, next.seo.ogImage, "og");
  if (Array.isArray(next.images)) {
    const images = [];
    for (let i = 0; i < next.images.length; i += 1) {
      const image = { ...next.images[i] };
      image.src = await storeImage(bucket, next.id, image.src, `detail-${i + 1}`);
      images.push(image);
    }
    next.images = images;
  }
  return next;
}

export async function upsertProject(db, project) {
  const now = Date.now();
  await db.prepare(`INSERT INTO cms_projects (id, slug, status, data, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, status = excluded.status, data = excluded.data, updated_at = excluded.updated_at`)
    .bind(String(project.id), String(project.slug), String(project.status), JSON.stringify(project), now).run();
}

export async function listProjects(db, publishedOnly = false) {
  const query = publishedOnly
    ? "SELECT data FROM cms_projects WHERE status = 'published' ORDER BY updated_at DESC"
    : "SELECT data FROM cms_projects ORDER BY updated_at DESC";
  const result = await db.prepare(query).all();
  return (result.results || []).map((row) => {
    try { return JSON.parse(row.data); } catch { return null; }
  }).filter(Boolean);
}

function managedKey(value) {
  if (typeof value !== "string" || !value.startsWith("/api/project-media/")) return null;
  try { return decodeURIComponent(value.slice("/api/project-media/".length)); } catch { return null; }
}

function projectMediaValues(project) {
  return [project?.coverImage, project?.mobileCoverImage, project?.seo?.ogImage, ...(Array.isArray(project?.images) ? project.images.map((image) => image?.src) : [])].filter(Boolean);
}

export async function getProjectById(db, id) {
  const row = await db.prepare("SELECT data FROM cms_projects WHERE id = ?").bind(String(id)).first();
  if (!row?.data) return null;
  try { return JSON.parse(row.data); } catch { return null; }
}

export async function cleanupReplacedProjectImages(bucket, previous, next) {
  if (!bucket || !previous) return;
  const keep = new Set(projectMediaValues(next));
  for (const value of projectMediaValues(previous)) {
    const key = managedKey(value);
    if (key && !keep.has(value)) await bucket.delete(key);
  }
}

export async function cleanupProjectImages(bucket, project) {
  if (!bucket || !project) return;
  for (const value of projectMediaValues(project)) {
    const key = managedKey(value);
    if (key) await bucket.delete(key);
  }
}

export async function cleanupNewProjectImages(bucket, original, stored) {
  if (!bucket || !stored) return;
  const originalManaged = new Set(projectMediaValues(original).filter((value) => managedKey(value)));
  for (const value of projectMediaValues(stored)) {
    const key = managedKey(value);
    if (key && !originalManaged.has(value)) await bucket.delete(key);
  }
}
