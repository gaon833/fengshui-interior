# 풍수 인테리어 v4.0.0 FINAL 검수 보고서

## 기준
- 기준 파일: v3.4.0 전체 프로젝트
- Next.js App Router
- 정적 export 및 Cloudflare Pages 배포 구조 유지

## 포함 기능
- 관리자 사이트 기본 설정
- 로고 및 PC/모바일 대표 이미지 설정
- 회사·연락처·주소·SNS 설정
- PROJECTS 2열, 혼합 비율, 평형 필터, 상세 연결
- 프로젝트 등록·수정·삭제, 이미지 관리, 노출 순서, 공개 상태
- SEO, Open Graph, 파비콘, sitemap, robots, 구조화 데이터
- PC·태블릿·모바일 반응형 보완

## 자동 검사 결과
- 콘텐츠 검증: 통과
- 기본 프로젝트: 60개
- 프로젝트 이미지 참조: 240개
- 충돌 표시: 없음
- 루트 중복 CSS: 없음
- JSON 파싱: 정상
- 정적 export 설정: 확인
- ZIP 무결성: 최종 압축 후 검사

## 운영 전에 입력할 값
- 실제 운영 도메인
- 블로그 URL
- 인스타그램 URL
- 카카오 상담 URL
- 네이버톡 URL
- 실제 회사 정보와 연락처

## 빌드 검증 제한
현재 제작 환경의 npm 저장소에서 `@types/node` 패키지를 제공하지 않아 `npm install`이 404로 실패했습니다. 따라서 이 환경에서는 Next.js 의존성을 설치한 실제 `npm run build`를 완료하지 못했습니다. 전역 TypeScript 검사도 React/Next 타입 패키지가 없어 실행 결과로 사용할 수 없습니다.

Cloudflare Pages 또는 정상 npm 레지스트리를 사용하는 로컬 환경에서 아래 순서로 최종 확인해야 합니다.

```bash
npm install
npm run validate
npm run typecheck
npm run build
```

Cloudflare 설정:
- Build command: `npm run build`
- Output directory: `out`
- Branch: `v3-reset`

## 저장 방식 주의
현재 관리자 입력 및 업로드 데이터는 브라우저 저장소 기반입니다. 같은 브라우저에서는 유지되고 공개 화면에 반영되지만, 다른 기기와 모든 방문자에게 공통으로 저장되는 서버형 CMS는 아닙니다. 서버 공통 저장이 필요하면 Cloudflare D1/R2 또는 별도 데이터베이스 연결이 필요합니다.
