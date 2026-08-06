# v7.6.2 최종 2차 구조 정리

## 목표
화면과 기능, 저장 구조, 이미지/렌더링 최적화는 유지하면서 프로젝트 내부의 확실한 비실행 잔재만 정리한다.

## 이번 2차에서 제거한 것
- `app/globals.css`: 현재 `app/layout.tsx`는 `@/styles/globals.css`만 불러오며 이 파일은 어떤 TS/TSX/CSS에서도 참조되지 않는 레거시 파일이어서 제거.
- `docs/history/`: 119개의 과거 수정/배포 보고서. 런타임 및 빌드에 관여하지 않으므로 최종 배포 소스에서 제외.

## 보존한 것
- 관리자 화면/CRUD/API 로직
- 이미지 업로드 전 브라우저 최적화
- 1920px 긴 변 제한, WebP 87%, 고품질 리샘플링, 30MB 입력 제한
- Cloudflare R2 저장/교체/삭제 정리 흐름
- Cloudflare D1 콘텐츠 저장
- localStorage 보조 캐시/호환 흐름
- 우선 이미지 로딩, lazy loading, async decoding, content-visibility 등 렌더링 최적화

## 원칙
사용 여부가 애매한 컴포넌트나 API는 코드량 감소만을 이유로 삭제하지 않았다. 확실한 dead asset/document만 제거했다.
