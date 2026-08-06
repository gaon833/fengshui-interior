# v7.5.12 전체 소스

- v7.5.11의 R2 업로드 구조 포함
- 관리자 이미지 업로드 -> `/api/admin/media-upload` -> `PROJECT_MEDIA.put()` -> R2 저장 -> URL을 D1에 저장
- R2 저장 실패 시 관리자 저장 성공으로 처리하지 않도록 구성
- D1 저장 실패 시 직전에 업로드한 R2 객체 정리 로직 유지
- ES2017 TypeScript 타깃에서 빌드가 실패하던 정규식 dotAll(`s`) 플래그 제거
  - `(.+)$/s` 대신 `([\\s\\S]+)$` 사용
- 패키지 버전: 7.5.12

Cloudflare Pages R2 Binding:
- Variable name: `PROJECT_MEDIA`
- Bucket: `fengshui-media`
