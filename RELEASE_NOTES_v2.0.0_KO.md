# v2.0.0 공통 로고 구조 확인 및 정리

## 확인 결과
- 모든 공개 페이지 로고는 `components/brand/BrandLogo.tsx` 한 컴포넌트를 사용합니다.
- 실제 로고 경로는 `content/site.json`의 `logo` 값 한 곳에서 관리됩니다.
- 메인, 고정 사이드바, 햄버거 메뉴 사이드바, 프로젝트 상세페이지가 모두 같은 로고 파일을 공유합니다.

## 이번 변경
- PC 로고 가로 보정값을 `styles/tokens.css`의 `--desktop-logo-offset-x` 한 곳에서 관리하도록 정리했습니다.
- 현재 값은 `-5px`이며 모든 PC 로고에 자동 적용됩니다.
- 모바일은 기존 위치를 그대로 유지합니다.
- 로고 파일, 크기, 색상, 선명도, 메뉴 및 레이아웃은 변경하지 않았습니다.

## 앞으로 수정하는 곳
- 로고 이미지 교체: `public/logo/brand-logo.png`
- 로고 경로 변경: `content/site.json`의 `logo`
- PC 로고 좌우 위치: `styles/tokens.css`의 `--desktop-logo-offset-x`
