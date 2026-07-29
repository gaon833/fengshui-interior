"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultSiteSettings, mergeSiteSettings, SITE_SETTINGS_EVENT, SITE_SETTINGS_KEY, type SiteSettings } from "@/lib/site-settings";

const SiteSettingsContext = createContext<SiteSettings>(mergeSiteSettings(defaultSiteSettings));

function readSettings() {
  try {
    const raw = window.localStorage.getItem(SITE_SETTINGS_KEY);
    return raw ? mergeSiteSettings(JSON.parse(raw)) : mergeSiteSettings(defaultSiteSettings);
  } catch {
    return mergeSiteSettings(defaultSiteSettings);
  }
}

export default function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(mergeSiteSettings(defaultSiteSettings));
  useEffect(() => {
    const sync = () => setSettings(readSettings());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SITE_SETTINGS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SITE_SETTINGS_EVENT, sync);
    };
  }, []);
  useEffect(() => {
    document.title = settings.seo.title || settings.brandName;
    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el) el.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', "content", settings.seo.description || "");
    setMeta('meta[property="og:title"]', "content", settings.seo.title || settings.brandName);
    setMeta('meta[property="og:description"]', "content", settings.seo.description || "");
    setMeta('meta[property="og:image"]', "content", settings.seo.ogImage || settings.mainImage);
    const favicon = settings.seo.favicon || settings.logo;
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"],link[rel="shortcut icon"]').forEach((link) => { link.href = favicon; });
  }, [settings]);
  const value = useMemo(() => settings, [settings]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() { return useContext(SiteSettingsContext); }
