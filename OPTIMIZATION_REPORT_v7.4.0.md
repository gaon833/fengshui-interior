# v7.4.0 홈페이지 최적화

## 적용 내용

- 공개 페이지의 이미지 삭제 UI를 `next/dynamic`으로 분리해 일반 방문 시 관리자 삭제 UI 청크를 지연 로드합니다.
- 삭제 확인 함수는 작은 독립 모듈로 분리해 삭제 UI 전체를 초기 번들에 포함하지 않도록 정리했습니다.
- Gallery 검색 입력에 `useDeferredValue`를 적용해 입력 반응과 검색 계산을 분리했습니다.
- Gallery 검색어 유사어 그룹을 이미지마다 반복 계산하지 않고 검색어 변경 시 한 번만 계산합니다.
- 숨김 이미지 ID 검색을 배열 `includes` 대신 `Set` 조회로 변경했습니다.
- 사용되지 않는 구형 `GalleryManager` 컴포넌트와 전용 CSS를 제거했습니다.

## 유지한 기능

- Gallery 태그 검색과 유사어 검색
- Gallery/Projects 삭제 모드
- 스크랩·공유·라이트박스
- 기존 Gallery Masonry 및 Projects 그리드
- 관리자 V7 화면과 D1/로컬 저장 로직

## 검증 참고

현재 작업 환경의 내부 npm 저장소에 `@types/node` 패키지가 없어 로컬 전체 빌드는 실행하지 못했습니다. Cloudflare Pages 환경에서는 기존과 같이 `npm install` 후 `npm run build`로 최종 확인해야 합니다.
