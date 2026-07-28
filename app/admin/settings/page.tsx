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
          <label>PC 메인 대표 이미지<input defaultValue={site.mainImage} /></label>
          <label>모바일 메인 대표 이미지<input defaultValue={site.mobileMainImage ?? ""} placeholder="/projects/example/portrait.jpg" /></label>
          <p className="admin-note">모바일 메인 대표 이미지만 세로 사진으로 별도 지정합니다. 프로젝트 목록과 상세 사진에는 영향을 주지 않습니다.</p>
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
