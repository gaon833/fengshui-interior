# Cloudflare Pages 배포

이 프로젝트는 정적 export 방식으로 배포하도록 설정되어 있습니다.

## GitHub 연결 배포 설정
- Production branch: `v3-reset` 또는 실제 배포할 브랜치
- Build command: `npm run build`
- Build output directory: `out`
- Root directory: 비워 둠 (프로젝트 파일이 저장소 루트에 있을 때)
- Node.js: 22

## 중요
GitHub 브랜치에는 이 ZIP의 바깥 폴더가 아니라 `app`, `components`, `content`, `public`, `styles`, `package.json`, `next.config.ts`가 저장소 루트에 바로 보여야 합니다.

이전에 오류가 발생한 `app/about/page.tsx`와 `components/SiteChrome`은 이 V3 최종본에 존재하지 않습니다. GitHub에서 기존 파일 위에 일부만 덮어쓰지 말고, `v3-reset` 브랜치 내용을 이 최종본으로 완전히 교체해야 합니다.
