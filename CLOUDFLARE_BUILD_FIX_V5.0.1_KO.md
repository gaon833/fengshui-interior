# Cloudflare 빌드 수정 v5.0.1

- `ShareProjectButton.tsx`에서 Web Share API 사용 여부를 `canUseNativeShare` 변수에 저장하도록 수정했습니다.
- 공유 실행 후 동일 조건을 재검사하면서 발생하던 TypeScript의 "항상 참" 오류를 제거했습니다.
- Cloudflare 로그에서 실패한 타입 오류 위치를 기준으로 수정했습니다.
- 로컬 빌드는 작업 환경의 내부 npm 저장소에서 `@types/node`를 제공하지 않아 실행하지 못했습니다. Cloudflare 재빌드로 최종 확인해야 합니다.
