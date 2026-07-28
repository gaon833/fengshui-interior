import site from "@/content/site.json";

export default function AdminContactPage() {
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>CONTACT 관리</h1>
          <p>문의 페이지의 연락처, 주소, SNS와 상담 연결 정보를 관리하는 화면입니다.</p>
        </div>
        <button type="button" className="admin-primary-button">저장</button>
      </div>

      <div className="editor-grid">
        <section className="editor-panel">
          <h2>연락처</h2>
          <label>전화번호<input defaultValue={site.contact.phone} /></label>
          <label>카카오 상담<input defaultValue={site.contact.kakaoUrl} /></label>
          <label>네이버톡<input defaultValue={site.contact.naverTalkUrl} /></label>
          <label>주소<input placeholder="서울특별시 ..." /></label>
        </section>

        <section className="editor-panel">
          <h2>SNS 및 문의 안내</h2>
          <label>블로그<input defaultValue={site.blogUrl} /></label>
          <label>인스타그램<input defaultValue={site.instagramUrl} /></label>
          <label>문의 안내문<textarea defaultValue="프로젝트 상담은 현장 정보와 희망 일정을 함께 남겨주세요." /></label>
          <p className="admin-note">문의 목록과 예약 데이터는 실제 데이터베이스 연결 단계에서 추가됩니다.</p>
        </section>
      </div>
    </>
  );
}
