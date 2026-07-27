# V2.3 빌드 오류 수정본

수정한 오류:
- `Project` 타입에 `style`, `sizeGroup` 속성이 빠져 Cloudflare 빌드가 실패하던 문제 수정

기존 V2.2 내용도 모두 포함:
- 모든 페이지 왼쪽 위 메뉴 아이콘 고정
- 메뉴 아이콘 위치·크기·모양·색상 통일
- Work 필터 2줄 구조
- 사이드 영역과 공통 글꼴 기준 통일

## 적용
1. 압축을 풉니다.
2. GitHub `develop` 브랜치에서 전체 파일을 덮어쓰기 업로드합니다.
3. Commit changes를 누릅니다.
4. Cloudflare가 새 Preview를 자동 빌드합니다.
