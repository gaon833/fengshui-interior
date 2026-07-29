"use client";

export type GalleryItem = {
  id: string;
  src: string;
  title: string;
  projectSlug?: string;
  projectTitle?: string;
  searchText?: string;
  createdAt: string;
};

const KEY = "fengshui-gallery-v2";
const LEGACY_KEY = "fengshui-gallery-v1";
export const GALLERY_EVENT = "fengshui-gallery-updated";

export function readGalleryItems(): GalleryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY) || window.localStorage.getItem(LEGACY_KEY) || "[]";
    const parsed = JSON.parse(raw) as Array<GalleryItem & { space?: string }>;
    return parsed.map((item) => ({
      id: item.id,
      src: item.src,
      title: item.title || "인테리어 이미지",
      projectSlug: item.projectSlug,
      projectTitle: item.projectTitle,
      searchText: item.searchText || [item.title, item.space, item.projectTitle, item.projectSlug].filter(Boolean).join(" "),
      createdAt: item.createdAt,
    }));
  } catch {
    return [];
  }
}

export function writeGalleryItems(items: GalleryItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(GALLERY_EVENT));
}

export function addGalleryItem(item: Omit<GalleryItem, "id" | "createdAt">) {
  const next: GalleryItem[] = [
    { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ...readGalleryItems(),
  ];
  writeGalleryItems(next);
}

export function deleteGalleryItem(id: string) {
  writeGalleryItems(readGalleryItems().filter((item) => item.id !== id));
}
