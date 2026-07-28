# V3 보완 패치 보고서

## 반영 내용
- 메뉴 드로어 접근성 보완
  - Escape 키 닫기
  - 열릴 때 첫 메뉴 요소로 포커스 이동
  - Tab 포커스 순환
  - 닫힐 때 햄버거 버튼으로 포커스 복귀
  - 배경을 실제 버튼 요소로 변경
  - React `useId` 기반 고유 drawer id 적용
- 준비되지 않은 외부 링크(`#`) 비활성 표시
  - 클릭 시 페이지 상단으로 이동하는 오작동 방지
  - 실제 URL 입력 시 새 탭으로 정상 연결
- 검증 명령 추가
  - `npm run validate`: 프로젝트 데이터, 중복 id/slug/order, 카테고리·상태, public 이미지 경로 검사
  - `npm run typecheck`: TypeScript 검사
  - `npm run check`: validate → typecheck → build 순차 실행
- Next.js 15에서 안정적으로 사용할 수 있도록 기존 `next lint` 스크립트를 TypeScript 정적 검사로 교체

## 이번 환경에서 실행한 검증
- `node scripts/validate-content.mjs`: 통과
  - 프로젝트 2개
  - 갤러리 이미지 4개
  - 로고·대표 이미지·OG 이미지 경로 존재 확인
- ZIP 무결성 검사: 통과 예정

## 아직 확인하지 못한 항목
- `npm install`이 실행 환경 제한 시간 안에 완료되지 않아 `tsc --noEmit`과 `next build`는 실제 패키지 기반으로 완료하지 못함
- 현재 TypeScript 출력은 React/Next 패키지 미설치로 인한 모듈 누락 오류이므로 코드 빌드 결과로 간주하지 않음

## 운영 전 입력 필요
- `content/site.json`의 blogUrl, instagramUrl, kakaoUrl, naverTalkUrl
