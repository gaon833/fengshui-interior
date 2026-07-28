export default function AdminServicePage() {
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>PROCESS 관리</h1>
          <p>상담 과정, 풍수 컨설팅, 시공 프로세스 내용을 관리하는 화면입니다.</p>
        </div>
        <button type="button" className="admin-primary-button">저장</button>
      </div>

      <div className="editor-grid">
        <section className="editor-panel">
          <h2>페이지 기본 정보</h2>
          <label>페이지 제목<input defaultValue="PROCESS" /></label>
          <label>소개 문구<textarea defaultValue="풍수 인테리어 상담과 시공 과정을 안내합니다." /></label>
          <label>대표 이미지 경로<input placeholder="/images/service-cover.jpg" /></label>
        </section>

        <section className="editor-panel">
          <h2>서비스 항목</h2>
          <label>항목 1<input defaultValue="풍수 인테리어 상담" /></label>
          <label>항목 2<input defaultValue="공간 진단 및 방향 제안" /></label>
          <label>항목 3<input defaultValue="디자인 및 시공 프로세스" /></label>
          <p className="admin-note">현재는 화면 구조만 구현되어 있으며 실제 저장은 데이터베이스 연결 후 동작합니다.</p>
        </section>
      </div>
    </>
  );
}
