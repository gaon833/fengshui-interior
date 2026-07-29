# 풍수 인테리어 v6.0.0

- Cloudflare Pages Functions + Workers AI 이미지 자동 분석
- GALLERY 업로드 시 공간·스타일·색상·자재·특징 자동 생성
- AI 분석 결과를 GALLERY 검색에 자동 반영
- Gallery 검색어·조회 통계 수집
- 관리자 통계에 인기 검색어·스타일·공간·색상 및 AI 인사이트 추가
- 기존 PROJECTS / GALLERY / SCRAP 레이아웃 유지

## Cloudflare 필수 설정
Pages 프로젝트 Settings > Bindings에 Workers AI 바인딩 이름 `AI`가 필요합니다. 설정 후 반드시 재배포하세요.

## 주의
현재 행동 통계는 각 브라우저의 localStorage 기준입니다. 모든 방문자의 통계를 합산하려면 Analytics Engine 또는 D1/KV 바인딩이 추가로 필요합니다.
