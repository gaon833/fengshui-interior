# v3-reset 완전 교체 안내

이 ZIP에는 최신 V3 파일만 들어 있습니다. `app/about/page.tsx`와 `components/SiteChrome.tsx`는 포함되어 있지 않습니다.

중요: GitHub 웹의 **Add files via upload**는 ZIP에 없는 기존 파일을 삭제하지 않습니다. 따라서 기존 브랜치 위에 덮어 올리면 오래된 파일이 남을 수 있습니다.

## 가장 안전한 교체 방법

1. GitHub에서 `v3-reset` 브랜치를 선택합니다.
2. 기존 파일을 전부 삭제하거나, 로컬에서 브랜치를 체크아웃한 뒤 저장소 루트 파일을 비웁니다. `.git` 폴더는 삭제하지 않습니다.
3. 이 ZIP을 풀고, ZIP 내부의 파일과 폴더를 저장소 최상단에 복사합니다.
4. 커밋 후 GitHub 검색에서 아래 검색 결과가 0개인지 확인합니다.
   - `SiteChrome`
   - `about.image`
   - `app/about/page.tsx`
5. Cloudflare Pages 설정:
   - Build command: `npm run build`
   - Build output directory: `out`
   - Root directory: 비워 두기

## 로컬에서 한 번에 교체하는 예시

```bash
git switch v3-reset
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
# 이 ZIP의 압축을 현재 저장소 루트에 해제
git add -A
git commit -m "Replace v3-reset with clean V3 build"
git push origin v3-reset
```
