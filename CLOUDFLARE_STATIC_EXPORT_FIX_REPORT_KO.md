# Cloudflare 정적 배포 오류 수정

수정 파일:
- app/manifest.ts
- app/robots.ts
- app/sitemap.ts

세 파일에 아래 설정을 추가했습니다.

```ts
export const dynamic = "force-static";
```

이 설정은 `next.config.ts`의 `output: "export"` 환경에서 manifest, robots, sitemap 메타데이터 경로가 정적으로 생성되도록 합니다.

사용자가 제공한 Cloudflare 빌드 로그의 오류인 `/manifest.webmanifest`, `/robots.txt` 정적 export 문제를 수정했으며, 동일한 유형의 후속 오류를 예방하기 위해 `/sitemap.xml`에도 함께 적용했습니다.

로컬 빌드 검증은 실행 환경의 내부 npm 레지스트리에서 `@types/node` 패키지를 가져오지 못해 진행하지 못했습니다. 이는 프로젝트 코드 오류가 아니라 현재 실행 환경의 패키지 레지스트리 오류입니다.
