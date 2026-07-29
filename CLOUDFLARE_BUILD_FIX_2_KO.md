# Cloudflare 빌드 오류 수정 2

- 버전: 4.0.3
- 오류: `/admin/projects/[id]`에서 `useSearchParams()` 사용 컴포넌트가 Suspense 경계 없이 정적 생성됨
- 수정: 해당 관리자 프로젝트 편집 페이지에서 `ProjectEditor`를 React `Suspense`로 감쌈
- 목적: Next.js 정적 export의 CSR bailout 요구사항 충족
