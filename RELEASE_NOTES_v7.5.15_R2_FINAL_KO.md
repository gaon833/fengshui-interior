# v7.5.15 R2 최종 통합

1차·2차·3차 검수 결과를 반영한 최종 통합 버전입니다.

- 관리자/홈페이지 GALLERY가 `lib/gallery-store.ts` 하나만 사용하도록 통합
- R2 업로드는 `/api/admin/media-upload` 하나로 통합
- R2 상태 확인은 `/api/admin/r2-health?probe=1` 하나로 통합
- 실제 R2 put → head 크기 검증 → URL 반환 유지
- D1 커밋 후의 일시적 조회 오류가 새 R2 객체를 삭제하지 않도록 롤백 경계 수정
- D1 저장 완료 뒤 기존 R2 이미지 삭제 실패는 저장 실패로 되돌리지 않고 best-effort 정리
- D1 저장 직후 서버에서 동일 ID/URL 재조회 확인
- 구버전 gallery-store 및 버전 전용 R2 Functions 삭제
- 버전 표기 7.5.15로 통일

Cloudflare Pages 바인딩은 기존과 동일합니다.
- D1: `DB`
- R2: `PROJECT_MEDIA` → `fengshui-media`
- R2 Public Access는 필요하지 않습니다.
- D1 요청 후 브라우저가 응답을 잃은 모호한 네트워크 상황에서는 새 R2 객체를 삭제하지 않아 DB→깨진 이미지 상태를 방지
- D1 커밋 이후 재조회 검증 실패는 경고로 기록하되 커밋 성공을 500으로 뒤집지 않음
