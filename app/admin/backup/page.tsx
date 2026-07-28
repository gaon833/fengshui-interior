import backups from "@/content/backups/manifest.json";

export default function BackupPage() {
  return (
    <>
      <div className="admin-heading">
        <div><h1>백업과 복원</h1><p>프로젝트 데이터와 사이트 설정 백업 틀입니다.</p></div>
        <button className="admin-primary-button" type="button">새 백업 만들기</button>
      </div>
      <div className="admin-table">
        {backups.map((backup) => (
          <div className="admin-row" key={backup.id}>
            <strong>{backup.createdAt}</strong>
            <span>{backup.projectCount}개 프로젝트</span>
            <span>{backup.note}</span>
            <button type="button">다운로드</button>
            <button type="button">복원</button>
          </div>
        ))}
      </div>
    </>
  );
}
