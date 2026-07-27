# 안전 복원본

이 버전은 처음 정상적으로 보였던 정적 홈페이지를 기준으로 만들었습니다.

그대로 유지되는 부분
- 메인 페이지 이미지 크기와 여백
- 왼쪽 위 로고 위치, 크기, 글꼴
- 오른쪽 위 햄버거 3줄
- 메뉴 클릭 시 왼쪽에서 열리는 400px 메뉴
- About / Contact 기존 구조

수정한 부분
- Work 페이지만 새 필터 2줄 적용
- All / Modern / Unique
- All / 20 / 30 / 40 / 50 / 60 / C
- HTML 기본 버튼 테두리가 보이지 않도록 처리
- 프로젝트 2열 레이아웃

Cloudflare 설정은 그대로 사용합니다.
- Build command: npm run build
- Build output directory: out
