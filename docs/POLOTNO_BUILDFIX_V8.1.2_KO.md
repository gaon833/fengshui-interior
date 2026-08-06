# v8.1.2 Polotno build fix

Cloudflare TypeScript 오류 수정:
- `PolotnoDesigner.tsx`: `createStore`에 항상 `key` 전달
- `PolotnoViewer.tsx`: 같은 패턴 수정
- 프로젝트 전체 `createStore()` 사용처를 다시 검색하여 `key` 누락 호출이 없는지 확인

기능 변경 없음:
- OUR STORY / PROCESS Polotno 편집기 유지
- D1 / R2 유지
- 이미지 최적화(1920px / WebP 87%) 유지
