"use client";

export type GalleryAnalyticsEvent = {
  id: string;
  type: "search" | "view";
  query?: string;
  imageId?: string;
  createdAt: string;
};

const KEY = "fengshui-gallery-analytics-v1";
export const GALLERY_ANALYTICS_EVENT = "fengshui-gallery-analytics-updated";

function readRaw(): GalleryAnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]") as GalleryAnalyticsEvent[]; }
  catch { return []; }
}

export function readGalleryAnalytics() { return readRaw(); }

function write(events: GalleryAnalyticsEvent[]) {
  window.localStorage.setItem(KEY, JSON.stringify(events.slice(0, 5000)));
  window.dispatchEvent(new CustomEvent(GALLERY_ANALYTICS_EVENT));
}

export function trackGallerySearch(query: string) {
  const normalized = query.trim();
  if (!normalized) return;
  write([{ id: crypto.randomUUID(), type: "search", query: normalized, createdAt: new Date().toISOString() }, ...readRaw()]);
}

export function trackGalleryView(imageId: string) {
  write([{ id: crypto.randomUUID(), type: "view", imageId, createdAt: new Date().toISOString() }, ...readRaw()]);
}
