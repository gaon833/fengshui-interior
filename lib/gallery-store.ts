"use client";

import type { GalleryTags } from "@/lib/gallery-tags";

export type GalleryAnalysis = {
  caption: string;
  space: string[];
  styles: string[];
  colors: string[];
  materials: string[];
  features: string[];
  keywords: string[];
  model?: string;
  analyzedAt?: string;
};

export type GalleryItem = {
  id: string;
  src: string;
  title: string;
  projectSlug?: string;
  projectTitle?: string;
  searchText?: string;
  analysis?: GalleryAnalysis;
  tags?: GalleryTags;
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
      analysis: item.analysis,
      tags: item.tags,
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

export function addGalleryItem(item: Omit<GalleryItem, "id" | "createdAt"> & { id?: string }) {
  addGalleryItems([item]);
}

export function addGalleryItems(items: Array<Omit<GalleryItem, "id" | "createdAt"> & { id?: string }>) {
  const createdAt = Date.now();
  const prepared: GalleryItem[] = items.map((item, index) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    createdAt: new Date(createdAt + index).toISOString(),
  }));
  // 같은 업로드 묶음은 사용자가 선택한 왼쪽→오른쪽 순서를 그대로 유지한다.
  writeGalleryItems([...prepared, ...readGalleryItems()]);
}

export function deleteGalleryItem(id: string) {
  writeGalleryItems(readGalleryItems().filter((item) => item.id !== id));
}

const HIDDEN_KEY = "fengshui-gallery-hidden-v1";
export function readHiddenGalleryIds(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(HIDDEN_KEY) || "[]") as string[]; } catch { return []; }
}
export function hideGalleryItem(id: string) {
  const next = Array.from(new Set([...readHiddenGalleryIds(), id]));
  window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(GALLERY_EVENT));
}
