# v7.5.11 R2 Gallery Binary Upload Fix

## 원인 검수
v7.5.10은 최적화 이미지를 base64 JSON으로 `/api/admin/gallery`에 직접 보내고, 같은 요청 안에서 R2 저장과 D1 저장을 함께 처리했습니다. 구조상 동작 가능하지만, 실제 운영 환경에서 R2 객체 생성 여부를 분리해 확인하기 어렵고 큰 JSON 본문을 다시 디코딩해야 했습니다.

## 변경
- 갤러리 이미지를 먼저 `/api/admin/media-upload`에 **바이너리(Blob)** 로 업로드합니다.
- R2가 성공해서 `/api/project-media/...` URL을 반환한 경우에만 `/api/admin/gallery`로 메타데이터를 저장합니다.
- D1 저장에 실패하면 직전에 올린 R2 객체를 자동 삭제해 고아 파일이 남지 않게 했습니다.
- 로컬스토리지의 오래된 일반 URL 이미지를 무조건 R2 저장 성공으로 오인해 마이그레이션하지 않도록 제한했습니다.
- 최종 관리자 캐시는 R2 URL이 확인된 항목만 반영합니다.

## 기대 흐름
관리자 파일 선택 → WebP 최적화 → binary POST `/api/admin/media-upload` → `PROJECT_MEDIA.put()` → R2 URL 반환 → POST `/api/admin/gallery` → D1 저장 → 관리자/홈페이지 표시
