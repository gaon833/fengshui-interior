# 풍수 인테리어 — 메뉴·로고 실제 공통 구조 최종본

이번 버전은 기존 CSS 위에 값을 추가한 것이 아니라,
기존 메뉴·로고 관련 선택자와 충돌 규칙을 styles.css / fixed-pages.css 등에서 제거했습니다.

## 메뉴
- 모든 메뉴 부모: `.shared-navigation`
- 모든 메뉴 링크: `.shared-navigation__link`
- 활성 메뉴: `.is-active`
- BLOG / INSTAGRAM: `.is-channel`
- 구분선: `.shared-navigation__divider`
- 디자인과 위치: `shared-navigation.css`
- 메뉴 이름과 링크: `shared-navigation.js`

기본 메뉴와 X가 있는 햄버거 메뉴는 같은 구조와 같은 파일만 사용합니다.
활성 메뉴도 글자 두께는 동일하며 색상만 진하게 표시됩니다.

## 로고
- 모든 로고 부모: `.shared-brand`
- 모든 로고 이미지: `.shared-brand__image`
- 위치와 크기: `shared-brand.css`
- 로고 파일 교체: `shared-brand.js`의 LOGO_FILE 한 곳

JavaScript가 실행되지 않아도 메뉴와 로고가 보이도록 실제 HTML fallback도 포함되어 있습니다.
