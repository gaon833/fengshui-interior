export default function AdminStudioPage() {
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>OUR STORY 관리</h1>
          <p>회사 소개, 브랜드 철학, 인사말과 스튜디오 이미지를 관리하는 화면입니다.</p>
        </div>
        <button type="button" className="admin-primary-button">저장</button>
      </div>

      <div className="editor-grid">
        <section className="editor-panel">
          <h2>회사 소개</h2>
          <label>페이지 제목<input defaultValue="OUR STORY" /></label>
          <label>브랜드 소개<textarea defaultValue="공간의 흐름과 사람의 생활을 함께 고려하는 인테리어 스튜디오입니다." /></label>
          <label>대표 이미지 경로<input placeholder="/images/studio-cover.jpg" /></label>
        </section>

        <section className="editor-panel">
          <h2>브랜드 철학</h2>
          <label>철학 제목<input defaultValue="공간과 사람의 조화" /></label>
          <label>철학 내용<textarea placeholder="브랜드 철학과 작업 방식을 입력하세요." /></label>
          <p className="admin-note">현재는 화면 구조만 구현되어 있으며 실제 저장은 데이터베이스 연결 후 동작합니다.</p>
        </section>
      </div>
    </>
  );
}
