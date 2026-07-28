# 풍수 인테리어 최종 공통 UI 재구축본

이번 버전은 기존 메뉴·로고 요소를 삭제하거나 복제하지 않습니다.
기존 드로어 열기/닫기 및 모바일 동작에 필요한 클래스는 그대로 유지하고,
공통 클래스만 추가해 `shared-ui.css` 한 파일에서 시각 속성을 통합합니다.

## 메뉴
- 기본 메뉴와 X 사이드바 모두 `shared-navigation` 사용
- 글꼴, 크기, 두께, 색상, 자간, 간격, 위치를 한 곳에서 변경
- 활성 메뉴는 굵기가 같고 색상만 진하게 표시
- RESERVATION 아래 구분선 복구
- 기존 메뉴를 JS로 다시 생성하지 않으므로 메뉴가 사라질 위험 없음

## 로고
- 기존 로고 요소를 그대로 사용하며 `shared-brand` 공통 클래스 적용
- 모든 로고 이미지에 `shared-brand__image` 적용
- 위치, 크기, 투명도를 `shared-ui.css` 한 곳에서 변경
- 로고 파일은 모든 페이지가 동일한
  `assets/logo/fengshui-interior-final.png`를 사용하므로
  해당 파일 하나를 교체하면 전체 로고가 함께 변경됨

## 안전성
- 기존 `brand`, `fixed-page-logo`, `detail-logo`, `drawer-brand`,
  `fixed-page-nav`, `side-nav` 클래스는 기능 호환을 위해 유지
- 새 로고나 새 메뉴 요소를 추가하지 않아 중복 표시가 발생하지 않음
- `shared-ui.css`는 모든 기존 CSS 다음에 로드됨
