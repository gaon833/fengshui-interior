import site from "@/content/site.json";

export default function SettingsPage() {
  return (
    <>
      <h1>사이트 설정</h1>
      <div className="editor-grid">
        <section className="editor-panel">
          <h2>브랜드</h2>
          <label>로고 경로<input defaultValue={site.logo} /></label>
          <label>브랜드명<input defaultValue={site.brandName} /></label>
        </section>
        <section className="editor-panel">
          <h2>링크와 문의</h2>
          <label>블로그<input defaultValue={site.blogUrl} /></label>
          <label>인스타그램<input defaultValue={site.instagramUrl} /></label>
          <label>카카오<input defaultValue={site.contact.kakaoUrl} /></label>
          <label>네이버톡<input defaultValue={site.contact.naverTalkUrl} /></label>
          <label>전화<input defaultValue={site.contact.phone} /></label>
        </section>
        <section className="editor-panel">
          <h2>기본 SEO</h2>
          <label>SEO 제목<input defaultValue={site.seo.title} /></label>
          <label>SEO 설명<textarea defaultValue={site.seo.description} /></label>
          <label>OG 이미지<input defaultValue={site.seo.ogImage} /></label>
        </section>
      </div>
    </>
  );
}
