# Polotno Build Fix v8.1.1

Cloudflare TypeScript 오류 수정:

- `createStore()` 호출에 `key`가 항상 포함되도록 수정
- 환경변수가 비어 있어도 타입상 `StoreProps.key` 요구사항을 만족
- 정식 운영에서는 Cloudflare 환경변수 `NEXT_PUBLIC_POLOTNO_KEY` 설정 필요
- OUR STORY / PROCESS 편집기, D1/R2, 1920px / WebP 87% 이미지 최적화 구조는 변경하지 않음
