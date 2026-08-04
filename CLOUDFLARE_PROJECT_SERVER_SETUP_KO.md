# 프로젝트 서버 저장 설정 (D1 + R2)

이 버전부터 PROJECTS 관리자 등록 데이터는 브라우저 localStorage만 사용하는 방식이 아니라 Cloudflare 서버 저장을 사용합니다.

## 저장 구조

- 프로젝트 정보/상태/순서/태그: 기존 Cloudflare D1 바인딩 `DB`
- 프로젝트 대표/모바일/상세 이미지: Cloudflare R2 바인딩 `PROJECT_MEDIA`
- 홈페이지 목록/상세: `/api/projects`에서 서버 데이터를 읽어 반영
- 관리자 저장: 기존 관리자 로그인 세션 확인 후 `/api/admin/projects`에 저장
- 기존 브라우저 localStorage 프로젝트: 서버 데이터가 비어 있을 때 관리자 페이지 첫 진입 시 자동 이전

## Cloudflare에서 한 번만 설정할 것

1. Cloudflare Dashboard → R2 → 새 버킷 생성
2. Pages 프로젝트 → Settings → Bindings → R2 bucket binding 추가
3. Variable name(바인딩 이름): `PROJECT_MEDIA`
4. 위에서 만든 R2 버킷을 선택
5. 기존 D1 바인딩 이름이 `DB`인지 확인
6. 저장 후 프로젝트를 재배포

D1의 `cms_projects` 테이블은 API가 처음 실행될 때 자동으로 생성되므로 별도 SQL 실행은 필요하지 않습니다.

## 동작 확인

1. 관리자 로그인
2. PROJECTS → 새 프로젝트
3. PC 대표 이미지와 필요한 이미지를 등록
4. 상태가 `공개`인지 확인 후 저장
5. 성공 메시지: `새 프로젝트가 서버에 저장되었습니다.`
6. 시크릿 창 또는 다른 기기에서 `/project/` 접속
7. 새 프로젝트가 동일하게 보이면 정상

R2 바인딩이 없으면 이미지가 포함된 새 프로젝트 저장 시 `R2 바인딩 PROJECT_MEDIA가 없습니다.`라는 오류가 표시됩니다. 이 경우 위의 R2 바인딩만 추가하면 됩니다.
