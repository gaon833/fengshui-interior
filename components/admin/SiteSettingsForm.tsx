"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { defaultSiteSettings, mergeSiteSettings, SITE_SETTINGS_EVENT, SITE_SETTINGS_KEY, type SiteSettings } from "@/lib/site-settings";
import { showAdminToast } from "@/lib/admin-toast";
import { IMAGE_GUIDES, guideText, confirmImageRatio, type ImageGuide } from "@/lib/image-guidelines";
import { optimizeImageFile } from "@/lib/image-optimizer";

const read = () => {
  try { const raw = localStorage.getItem(SITE_SETTINGS_KEY); return raw ? mergeSiteSettings(JSON.parse(raw)) : mergeSiteSettings(defaultSiteSettings); }
  catch { return mergeSiteSettings(defaultSiteSettings); }
};

async function imageToDataUrl(file: File): Promise<string> {
  return optimizeImageFile(file, { maxWidth: 1600, maxHeight: 2400, quality: 0.84 });
}


export default function SiteSettingsForm() {
  const [site, setSite] = useState<SiteSettings>(() => mergeSiteSettings(defaultSiteSettings));
  const [message, setMessage] = useState("");
  useEffect(() => setSite(read()), []);
  const set = (path: string, value: string) => setSite((current) => {
    const next = structuredClone(current) as any; const keys = path.split("."); let target = next;
    keys.slice(0, -1).forEach((key) => target = target[key]); target[keys.at(-1)!] = value; return next;
  });
  const upload = async (path: string, event: ChangeEvent<HTMLInputElement>, guide: ImageGuide) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { if (!(await confirmImageRatio(file, guide))) { event.target.value = ""; return; } set(path, await imageToDataUrl(file)); const text = `${file.name} 업로드가 완료되었습니다. 저장 버튼을 눌러 적용하세요.`; setMessage(text); showAdminToast(text, "success"); } catch (error) { const text = error instanceof Error ? error.message : "업로드에 실패했습니다."; setMessage(text); showAdminToast(text, "error"); }
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    try {
      const normalized = structuredClone(site);
      normalized.blogUrl = normalized.blogUrl?.trim() || "";
      normalized.instagramUrl = normalized.instagramUrl?.trim() || "";
      normalized.reservationUrl = normalized.reservationUrl?.trim() || "";
      normalized.contact.kakaoUrl = normalized.contact.kakaoUrl?.trim() || "";
      normalized.contact.naverTalkUrl = normalized.contact.naverTalkUrl?.trim() || "";
      localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(normalized));
      setSite(normalized); window.dispatchEvent(new Event(SITE_SETTINGS_EVENT)); const text = "설정이 저장되었습니다."; setMessage(text); showAdminToast(text, "success"); }
    catch { const text = "저장에 실패했습니다. 이미지 용량을 줄여주세요."; setMessage(text); showAdminToast(text, "error"); }
  };
  const reset = () => { if (!window.confirm("사이트 설정을 기본값으로 복원할까요?")) return; localStorage.removeItem(SITE_SETTINGS_KEY); setSite(mergeSiteSettings(defaultSiteSettings)); window.dispatchEvent(new Event(SITE_SETTINGS_EVENT)); const text = "기본 설정으로 복원되었습니다."; setMessage(text); showAdminToast(text, "success"); };
  const field = (label: string, path: string, value: string, type="text") => <label>{label}<input type={type} value={value || ""} onChange={(e) => set(path, e.target.value)} /></label>;
  const imageField = (label: string, path: string, value: string, guide: ImageGuide) => <label>{label} <span className="admin-image-guide">{guideText(guide)}</span><input value={value || ""} onChange={(e) => set(path, e.target.value)} /><input type="file" accept="image/*" onChange={(e) => upload(path, e, guide)} />{value ? <span className="admin-upload-preview"><img src={value} alt={`${label} 미리보기`} /></span> : null}</label>;
  return <form onSubmit={save}>
    <div className="editor-grid">
      <section className="editor-panel"><h2>브랜드와 대표 이미지</h2>
        {imageField("로고", "logo", site.logo, IMAGE_GUIDES.logo)}
        {field("브랜드명", "brandName", site.brandName)}
        {imageField("PC 메인 대표 이미지", "mainImage", site.mainImage, IMAGE_GUIDES.mainPc)}
        {imageField("모바일 메인 대표 이미지", "mobileMainImage", site.mobileMainImage || "", IMAGE_GUIDES.mainMobile)}
        <p className="admin-note">고화질 원본을 올리면 자동으로 크기와 용량을 줄여 WebP로 저장합니다.</p>
      </section>
      <section className="editor-panel"><h2>회사 정보</h2>
        {field("회사명", "company.name", site.company?.name || site.brandName)}
        {field("대표자명", "company.representative", site.company?.representative || "")}
        {field("전화번호", "contact.phone", site.contact.phone)}
        {field("이메일", "company.email", site.company?.email || "", "email")}
        {field("주소", "contact.address", site.contact.address)}
        {field("저작권 문구", "contact.copyright", site.contact.copyright)}
      </section>
      <section className="editor-panel"><h2>SNS와 상담</h2>
        {field("블로그 링크", "blogUrl", site.blogUrl)}
        {field("인스타그램 링크", "instagramUrl", site.instagramUrl)}
        {field("상담 링크", "reservationUrl", site.reservationUrl)}
        {field("카카오 링크", "contact.kakaoUrl", site.contact.kakaoUrl)}
        {field("네이버톡 링크", "contact.naverTalkUrl", site.contact.naverTalkUrl)}
      </section>
      <section className="editor-panel"><h2>SEO</h2>
        {field("홈페이지 주소", "siteUrl", site.siteUrl)}
        {field("홈페이지 제목", "seo.title", site.seo.title)}
        <label>홈페이지 설명<textarea value={site.seo.description} onChange={(e) => set("seo.description", e.target.value)} /></label>
        {field("SEO 키워드", "seo.keywords", site.seo.keywords || "")}
        {imageField("Open Graph 이미지", "seo.ogImage", site.seo.ogImage, IMAGE_GUIDES.og)}
        {imageField("파비콘", "seo.favicon", site.seo.favicon || site.logo, IMAGE_GUIDES.favicon)}
      </section>
    </div>
    <div className="admin-form-actions"><button type="submit">설정 저장</button><button type="button" onClick={reset}>기본값 복원</button></div>
  </form>;
}
