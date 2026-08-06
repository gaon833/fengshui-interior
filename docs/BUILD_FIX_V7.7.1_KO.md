# v7.7.1 Cloudflare 빌드 수정

Cloudflare v7.7.0 빌드에서 발견된 import 연결 오류를 수정했습니다.

- `useAdminDeleteMode`: `@/lib/admin-delete-mode`에서 import
- `AdminDeleteChrome`: named export로 import
- 대상: `components/site/StoryContent.tsx`, `components/site/ProcessContent.tsx`
- 자유 배치 편집기, D1/R2, 이미지 최적화 로직은 변경하지 않음
