# v7.5.16 R2 Atomic Gallery Fix

- Gallery 신규 이미지 저장을 `/api/admin/gallery` 단일 multipart 요청으로 통합했습니다.
- 동일 Pages Function 안에서 `R2 PUT → HEAD 검증 → D1 저장 → D1 재조회`를 순서대로 처리합니다.
- 별도 `/api/admin/media-upload` 호출에 의존하지 않아 Gallery 라우팅 불일치 가능성을 제거했습니다.
- R2 Health는 더 이상 임시 객체를 만들고 삭제하지 않습니다. 따라서 Health 호출 때문에 Operations만 증가하는 혼선을 줄였습니다.
- `/admin/gallery` 정적 HTML에 `STATIC BUILD MARKER v7.5.16`을 추가해 실제 최신 HTML 배포 여부를 눈으로 확인할 수 있습니다.
- JSON 기반 구형 Gallery 저장 요청도 계속 지원합니다.
