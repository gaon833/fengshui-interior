"use client";
import { useEffect } from "react";
import { sendServerAnalytics } from "@/lib/server-analytics";

export default function VisitTracker() {
  useEffect(() => {
    const key = `fengshui-visit:${new Date().toISOString().slice(0,10)}`;
    if (!window.sessionStorage.getItem(key)) {
      window.sessionStorage.setItem(key, "1");
      sendServerAnalytics({ eventType: "visit", metadata: { path: window.location.pathname } });
    }
  }, []);
  return null;
}
