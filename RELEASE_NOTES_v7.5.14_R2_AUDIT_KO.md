# v7.5.14 R2 정밀 검수 수정

핵심 원인: 실제 `/admin/gallery/` 페이지는 `GalleryManagerV7.tsx`를 사용하지만 이전 점검 과정에서 `GalleryManager.tsx`를 수정한 이력이 있어, 수정 코드가 실제 화면 경로에 반영되지 않는 혼선이 있었습니다.

이번 버전은 실제 라우트가 사용하는 컴포넌트를 신규 파일 `GalleryManagerR2V7514.tsx`로 교체하여 캐시/구버전 혼선을 차단했습니다.

- 관리자 상단에 `R2 검증 빌드 v7.5.14` 검은 배너 표시
- R2 Health가 실제 put → head/get → delete 쓰기/읽기 검증 수행
- 업로드 전 R2 health 정상일 때만 저장 버튼 활성화
- 이미지 업로드 전용 새 경로 `/api/admin/gallery-media-v7514`
- R2 put 후 head 크기 검증
- 반환된 `/api/project-media/...` URL을 GET하여 실제 읽기 검증
- D1 저장 후 서버를 다시 조회해 같은 id + R2 URL이 존재하는지 재검증
- 어떤 검증이라도 실패하면 UI를 성공 처리하지 않고 오류 표시
- 실패한 신규 R2 객체는 자동 정리
- 관리자 서버 조회는 실패 시 localStorage로 조용히 성공 처리하지 않음
