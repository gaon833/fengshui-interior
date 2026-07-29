"use client";

export type ScrapKind = "project" | "image";
export type ScrapItem = {
  id: string;
  kind: ScrapKind;
  projectSlug: string;
  projectTitle: string;
  src: string;
  alt: string;
  savedAt: string;
};

type EngagementEvent = {
  id: string;
  type: "view" | "scrap" | "unscrap" | "share";
  projectSlug: string;
  projectTitle: string;
  target: ScrapKind;
  imageId?: string;
  createdAt: string;
};

const SCRAPS_KEY = "fengshui-scraps-v1";
const EVENTS_KEY = "fengshui-engagement-v1";
export const ENGAGEMENT_EVENT = "fengshui-engagement-updated";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function readScraps(): ScrapItem[] {
  if (typeof window === "undefined") return [];
  return safeParse<ScrapItem[]>(window.localStorage.getItem(SCRAPS_KEY), []);
}

function writeScraps(items: ScrapItem[]) {
  window.localStorage.setItem(SCRAPS_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(ENGAGEMENT_EVENT));
}

export function isScrapped(id: string) { return readScraps().some((item) => item.id === id); }

export function toggleScrap(item: Omit<ScrapItem, "savedAt">): boolean {
  const items = readScraps();
  const exists = items.some((saved) => saved.id === item.id);
  const next = exists ? items.filter((saved) => saved.id !== item.id) : [{ ...item, savedAt: new Date().toISOString() }, ...items];
  writeScraps(next);
  trackEngagement({ type: exists ? "unscrap" : "scrap", projectSlug: item.projectSlug, projectTitle: item.projectTitle, target: item.kind, imageId: item.kind === "image" ? item.id : undefined });
  return !exists;
}

export function trackEngagement(event: Omit<EngagementEvent, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const current = safeParse<EngagementEvent[]>(window.localStorage.getItem(EVENTS_KEY), []);
  const next: EngagementEvent[] = [{ ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...current].slice(0, 5000);
  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(ENGAGEMENT_EVENT));
}

export function readEngagementEvents(): EngagementEvent[] {
  if (typeof window === "undefined") return [];
  return safeParse<EngagementEvent[]>(window.localStorage.getItem(EVENTS_KEY), []);
}
