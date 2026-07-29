"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  defaultSiteSettings,
  mergeSiteSettings,
  SITE_SETTINGS_EVENT,
  SITE_SETTINGS_KEY,
  type SiteSettings,
} from "@/lib/site-settings";

function readSettings(): SiteSettings {
  try {
    const raw = window.localStorage.getItem(SITE_SETTINGS_KEY);
    return raw
      ? mergeSiteSettings(JSON.parse(raw))
      : mergeSiteSettings(defaultSiteSettings);
  } catch {
    return mergeSiteSettings(defaultSiteSettings);
  }
}

export default function ContactSettingsForm() {
  const [form, setForm] = useState<SiteSettings>(() =>
    mergeSiteSettings(defaultSiteSettings),
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(readSettings());
  }, []);

  const update = (path: string, value: string) => {
    setSaved(false);
    setForm((current) => {
      const next = structuredClone(current) as SiteSettings;
      const keys = path.split(".");
      let target: Record<string, unknown> = next as unknown as Record<string, unknown>;

      keys.slice(0, -1).forEach((key) => {
        target = target[key] as Record<string, unknown>;
      });
      target[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(form));
    window.dispatchEvent(new Event(SITE_SETTINGS_EVENT));
    setSaved(true);
  };

  return (
    <form onSubmit={submit}>
      <div className="admin-heading">
        <div>
          <h1>CONSULTATION 관리</h1>
          <p>메뉴 하단에 표시되는 회사 정보와 블로그·인스타그램 주소를 관리합니다.</p>
        </div>
        <button type="submit" className="admin-primary-button">저장</button>
      </div>

      {saved && <p className="admin-save-message" role="status">현재 브라우저에 저장했습니다.</p>}

      <div className="editor-grid">
        <section className="editor-panel">
          <h2>회사 정보</h2>
          <label>회사명<input value={form.company?.name || form.brandName} onChange={(e) => update("company.name", e.target.value)} /></label>
          <label>주소<input value={form.contact.address} onChange={(e) => update("contact.address", e.target.value)} /></label>
          <label>전화번호<input value={form.contact.phone} onChange={(e) => update("contact.phone", e.target.value)} /></label>
          <label>저작권 문구<textarea value={form.contact.copyright} onChange={(e) => update("contact.copyright", e.target.value)} /></label>
        </section>

        <section className="editor-panel">
          <h2>SNS 링크</h2>
          <label>블로그 주소<input value={form.blogUrl} onChange={(e) => update("blogUrl", e.target.value)} placeholder="https://blog.naver.com/..." /></label>
          <label>인스타그램 주소<input value={form.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." /></label>
          <p className="admin-note">현재는 브라우저 저장 방식입니다. 데이터베이스 연결 후 모든 기기에서 공통으로 관리할 수 있습니다.</p>
        </section>
      </div>
    </form>
  );
}
