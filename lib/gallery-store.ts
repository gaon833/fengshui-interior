"use client";

export type GalleryItem = {
  id: string;
  src: string;
  title: string;
  space: string;
  projectSlug?: string;
  projectTitle?: string;
  createdAt: string;
};

const KEY = "fengshui-gallery-v1";
export const GALLERY_EVENT = "fengshui-gallery-updated";

export function readGalleryItems(): GalleryItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]") as GalleryItem[]; }
  catch { return []; }
}

export function writeGalleryItems(items: GalleryItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(GALLERY_EVENT));
}

export function addGalleryItem(item: Omit<GalleryItem, "id" | "createdAt">) {
  const next: GalleryItem[] = [{ ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...readGalleryItems()];
  writeGalleryItems(next);
}

export function deleteGalleryItem(id: string) {
  writeGalleryItems(readGalleryItems().filter((item) => item.id !== id));
}
