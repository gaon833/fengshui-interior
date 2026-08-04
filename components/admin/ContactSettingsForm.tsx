"use client";

import { FormEvent, useEffect, useState } from "react";
import { showAdminToast } from "@/lib/admin-toast";
import {
  defaultSiteSettings,
  mergeSiteSettings,
  SITE_SETTINGS_EVENT,
  SITE_SETTINGS_KEY,
  type SiteSettings,
} from "@/lib/site-settings";
import { fetchCmsContent, saveCmsContent } from "@/lib/cms-content-client";

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

  useEffect(() => {
    const local=readSettings(); setForm(local); void fetchCmsContent<SiteSettings>("site", local, true).then((remote)=>setForm(mergeSiteSettings(remote)));
  }, []);

  const update = (path: string, value: string) => {
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try { const stored=await saveCmsContent<SiteSettings>("site", form); window.localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(stored)); setForm(mergeSiteSettings(stored)); window.dispatchEvent(new Event(SITE_SETTINGS_EVENT)); showAdminToast("상담 정보가 D1에 저장되었습니다.", "success"); }
    catch(error){ showAdminToast(error instanceof Error?error.message:"서버 저장에 실패했습니다.","error"); }
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
          <p className="admin-note">D1에 저장되어 모든 기기에서 동일하게 표시됩니다.</p>
        </section>
      </div>
    </form>
  );
}
