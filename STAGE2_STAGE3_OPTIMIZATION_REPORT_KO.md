# 2단계·3단계 적용 보고서

## 2단계: 안정화

- 콘텐츠 데이터 검사 통과: 프로젝트 60개, 상세 이미지 데이터 240개
- 이미지·로고·OG 이미지 경로 전체 검사 통과
- 공개 페이지별 SEO 제목·설명 추가
- 모바일 및 긴 포트폴리오 페이지의 렌더링 부담을 줄이기 위한 `content-visibility` 적용
- 모션 축소 설정 사용자를 위한 `prefers-reduced-motion` 대응
- 기존 공개 페이지 복사 방지와 관리자 제외 구조 유지

## 3단계: 최적화

- JPG 프로젝트 이미지 7개를 WebP로 변환하고 모든 데이터 경로 변경
- 프로젝트 이미지 용량 합계 약 1.1MB에서 WebP 약 340KB로 축소
- 메인 이미지와 첫 프로젝트 이미지 우선 로딩
- 나머지 목록·상세 갤러리 이미지 지연 로딩 및 비동기 디코딩
- 이미지 `sizes`와 품질 값 조정
- 전역 메타데이터, Open Graph, Twitter Card 추가
- 프로젝트별 동적 SEO 메타데이터 추가
- canonical URL 추가
- `sitemap.xml`, `robots.txt`, `manifest.webmanifest` 자동 생성 코드 추가
- Organization, LocalBusiness, WebSite, 프로젝트 CreativeWork 구조화 데이터 추가
- Cloudflare Pages용 `_headers` 추가
  - 정적 자산 장기 캐시
  - 프로젝트 이미지 캐시
  - 기본 보안 헤더
- 관리자 페이지는 robots에서 검색 제외

## 확인 결과

- 콘텐츠 검증: 통과
- 참조 이미지 누락: 0개
- ZIP 무결성: 통과
- 실제 Next.js 빌드: npm 의존성 설치가 실행 환경 제한 시간 안에 완료되지 않아 미실행

## 배포 후 필요한 설정

- `content/site.json`의 `siteUrl`을 실제 최종 도메인으로 변경
- 블로그·인스타그램·카카오·네이버톡 실제 URL 입력
- 도메인 연결 후 Lighthouse/PageSpeed 실측
- 네이버 서치어드바이저와 Google Search Console 등록
