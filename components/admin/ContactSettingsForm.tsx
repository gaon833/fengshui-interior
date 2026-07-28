"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  defaultSiteContact,
  SITE_CONTACT_STORAGE_KEY,
  SITE_CONTACT_UPDATED_EVENT,
  SiteContactSettings,
} from "@/components/site/SocialFooter";

export default function ContactSettingsForm() {
  const [form, setForm] = useState<SiteContactSettings>(defaultSiteContact);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const current = window.localStorage.getItem(SITE_CONTACT_STORAGE_KEY);
      if (current) setForm({ ...defaultSiteContact, ...JSON.parse(current) });
    } catch {
      setForm(defaultSiteContact);
    }
  }, []);

  const update = (key: keyof SiteContactSettings, value: string) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(SITE_CONTACT_STORAGE_KEY, JSON.stringify(form));
    window.dispatchEvent(new Event(SITE_CONTACT_UPDATED_EVENT));
    setSaved(true);
  };

  return (
    <form onSubmit={submit}>
      <div className="admin-heading">
        <div>
          <h1>CONTACT 관리</h1>
          <p>메뉴 하단에 표시되는 회사 정보와 블로그·인스타그램 주소를 관리합니다.</p>
        </div>
        <button type="submit" className="admin-primary-button">저장</button>
      </div>

      {saved && <p className="admin-save-message" role="status">현재 브라우저에 저장했습니다.</p>}

      <div className="editor-grid">
        <section className="editor-panel">
          <h2>회사 정보</h2>
          <label>회사명<input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} /></label>
          <label>주소<input value={form.address} onChange={(e) => update("address", e.target.value)} /></label>
          <label>전화번호<input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label>
          <label>저작권 문구<textarea value={form.copyright} onChange={(e) => update("copyright", e.target.value)} /></label>
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
