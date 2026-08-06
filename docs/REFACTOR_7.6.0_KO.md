# 7.6.0 구조 정리

기준 버전: 7.5.22-remove-project-year

이번 정리는 화면/기능 변경이 아니라 유지보수 구조 정리입니다.

- 루트에 누적된 과거 릴리스/패치 문서를 `docs/history/`로 이동
- `ProjectsV7.module.css` → `Projects.module.css`
- `GalleryManagerV7.module.css` → `GalleryManager.module.css`
- `globals.css` 끝에 섞여 있던 삭제모드 CSS를 `styles/delete-mode.css`로 분리하되 로딩 순서는 유지
- `.DS_Store`, `tsconfig.tsbuildinfo` 같은 로컬 산출물 제거
- 프로젝트 전용 `AGENTS.md`를 추가해 향후 수정 시 최소 변경/공통 원인 수정/중복 방지 원칙을 고정

디자인, 콘텐츠, URL, API, 관리자 기능 로직은 의도적으로 변경하지 않았습니다.
