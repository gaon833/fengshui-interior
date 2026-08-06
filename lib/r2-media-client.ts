"use client";

function isDataImage(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/");
}

function dataUrlToBlob(value: string): Blob {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) throw new Error("지원하지 않는 이미지 데이터입니다.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: match[1].toLowerCase() });
}

export async function uploadDataImage(value: string, namespace: string, label: string, uploaded?: string[]): Promise<string> {
  if (!isDataImage(value)) return value;
  const blob = dataUrlToBlob(value);
  const response = await fetch("/api/admin/media-upload", {
    method: "POST",
    headers: {
      "content-type": blob.type || "image/webp",
      "x-media-namespace": namespace,
      "x-media-label": label,
    },
    credentials: "include",
    body: blob,
  });
  const data = await response.json().catch(() => null) as { ok?: boolean; url?: string; error?: string } | null;
  if (!response.ok || !data?.ok || !data.url) throw new Error(data?.error || "R2 이미지 업로드에 실패했습니다.");
  uploaded?.push(data.url);
  return data.url;
}

export async function uploadProjectDataImages<T>(project: T, uploaded?: string[]): Promise<T> {
  const next: any = structuredClone(project);
  const id = String(next.id || "project");
  const originalCover = next.coverImage;
  if (isDataImage(next.coverImage)) next.coverImage = await uploadDataImage(next.coverImage, id, "cover", uploaded);
  if (isDataImage(next.mobileCoverImage)) next.mobileCoverImage = await uploadDataImage(next.mobileCoverImage, id, "mobile-cover", uploaded);
  if (isDataImage(next.seo?.ogImage)) {
    next.seo.ogImage = next.seo.ogImage === originalCover && next.coverImage !== originalCover
      ? next.coverImage
      : await uploadDataImage(next.seo.ogImage, id, "og", uploaded);
  }
  if (Array.isArray(next.images)) {
    for (let i = 0; i < next.images.length; i += 1) {
      if (isDataImage(next.images[i]?.src)) next.images[i].src = await uploadDataImage(next.images[i].src, id, `detail-${i + 1}`, uploaded);
    }
  }
  return next;
}

export async function uploadKnownContentImages<T>(key: string, value: T, uploaded?: string[]): Promise<T> {
  const next: any = structuredClone(value);
  if (key === "site") {
    for (const field of ["logo", "mainImage", "mobileMainImage"]) if (isDataImage(next?.[field])) next[field] = await uploadDataImage(next[field], "site", field, uploaded);
    if (isDataImage(next?.seo?.ogImage)) next.seo.ogImage = await uploadDataImage(next.seo.ogImage, "site", "og", uploaded);
    if (isDataImage(next?.seo?.favicon)) next.seo.favicon = await uploadDataImage(next.seo.favicon, "site", "favicon", uploaded);
  } else if (key === "story" || key === "process") {
    if (isDataImage(next?.image)) next.image = await uploadDataImage(next.image, "page", key, uploaded);
    if (Array.isArray(next?.blocks)) {
      for (let i=0;i<next.blocks.length;i+=1) {
        if (next.blocks[i]?.type === "image" && isDataImage(next.blocks[i]?.src)) {
          next.blocks[i].src = await uploadDataImage(next.blocks[i].src, `page-${key}`, `block-${i+1}`, uploaded);
        }
      }
    }
  }
  return next as T;
}

export async function uploadGalleryDataImages<T extends { id: string; src: string }>(items: T[], uploaded?: string[]): Promise<T[]> {
  const next = structuredClone(items);
  for (const item of next) if (isDataImage(item.src)) item.src = await uploadDataImage(item.src, "gallery", item.id || "image", uploaded);
  return next;
}

export async function rollbackUploadedMedia(urls: string[]): Promise<void> {
  if (!urls.length) return;
  await fetch("/api/admin/media-upload", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ urls }),
  }).catch(() => undefined);
}
