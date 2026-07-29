"use client";

const VISITOR_KEY = "fengshui-visitor-id-v1";

export type ServerAnalyticsEvent = {
  eventType: "visit" | "view" | "gallery_view" | "search" | "scrap" | "unscrap" | "share";
  projectSlug?: string;
  galleryId?: string;
  imageId?: string;
  searchQuery?: string;
  metadata?: Record<string, unknown>;
};

export function getVisitorId() {
  if (typeof window === "undefined") return "";
  let value = window.localStorage.getItem(VISITOR_KEY);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, value);
  }
  return value;
}

export function sendServerAnalytics(event: ServerAnalyticsEvent) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ ...event, visitorId: getVisitorId() });
  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon("/api/analytics/event", new Blob([payload], { type: "application/json" }));
      if (sent) return;
    }
  } catch {}
  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
