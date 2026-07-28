"use client";

import { useEffect, useState, type ReactNode } from "react";
import site from "@/content/site.json";

export const SITE_CONTACT_STORAGE_KEY = "fengshui-site-contact";
export const SITE_CONTACT_UPDATED_EVENT = "fengshui-site-contact-updated";

export type SiteContactSettings = {
  companyName: string;
  address: string;
  phone: string;
  copyright: string;
  blogUrl: string;
  instagramUrl: string;
};

export const defaultSiteContact: SiteContactSettings = {
  companyName: site.brandName || "풍수 인테리어",
  address: site.contact.address || "서울특별시 마포구 양화로 17-9",
  phone: site.contact.phone || "02-0000-0000",
  copyright: site.contact.copyright || "© Copyright 2026 풍수 인테리어. All rights reserved.",
  blogUrl: site.blogUrl || "#",
  instagramUrl: site.instagramUrl || "#",
};

function readSettings(): SiteContactSettings {
  if (typeof window === "undefined") return defaultSiteContact;
  try {
    const saved = window.localStorage.getItem(SITE_CONTACT_STORAGE_KEY);
    if (!saved) return defaultSiteContact;
    return { ...defaultSiteContact, ...JSON.parse(saved) };
  } catch {
    return defaultSiteContact;
  }
}

function SocialAnchor({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  const available = Boolean(href && href !== "#");
  if (!available) {
    return <span className="social-icon-link is-disabled" aria-label={`${label} 링크 준비 중`}>{children}</span>;
  }
  return <a className="social-icon-link" href={href} target="_blank" rel="noreferrer" aria-label={label}>{children}</a>;
}

export default function SocialFooter() {
  const [settings, setSettings] = useState<SiteContactSettings>(defaultSiteContact);

  useEffect(() => {
    const update = () => setSettings(readSettings());
    update();
    window.addEventListener("storage", update);
    window.addEventListener(SITE_CONTACT_UPDATED_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(SITE_CONTACT_UPDATED_EVENT, update);
    };
  }, []);

  return (
    <div className="sidebar-social-footer">
      <div className="sidebar-social-icons" aria-label="소셜 미디어">
        <SocialAnchor href={settings.blogUrl} label="블로그">
          <svg className="social-icon social-icon--blog" viewBox="0 0 44 44" aria-hidden="true">
            <path d="M5 7.5h34v24H25.5L20 38l-3.5-6.5H5z" fill="currentColor" />
            <text x="22" y="23.2" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">blog</text>
          </svg>
        </SocialAnchor>
        <SocialAnchor href={settings.instagramUrl} label="인스타그램">
          <svg className="social-icon social-icon--instagram" viewBox="0 0 44 44" aria-hidden="true">
            <rect x="7" y="7" width="30" height="30" rx="8" fill="none" stroke="currentColor" strokeWidth="3.5" />
            <circle cx="22" cy="22" r="7" fill="none" stroke="currentColor" strokeWidth="3.5" />
            <circle cx="31.5" cy="12.8" r="2" fill="currentColor" />
          </svg>
        </SocialAnchor>
      </div>
      <div className="sidebar-company-info">
        <strong>{settings.companyName}</strong>
        <span>{settings.address}</span>
        <span>Tel : {settings.phone}</span>
        <small>{settings.copyright}</small>
      </div>
    </div>
  );
}
