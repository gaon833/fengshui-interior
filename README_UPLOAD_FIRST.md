# 풍수 인테리어 — GitHub 최종 업로드 파일

이 ZIP의 압축을 푼 뒤 GitHub 저장소 `gaon833/fengshui-interior`에
README.md와 함께 모든 파일을 업로드하세요.

## Cloudflare Pages 설정

- Framework preset: None
- Build command: 비워 두기
- Build output directory: `/`
- Production branch: main

파일 업로드가 끝난 뒤 Cloudflare 화면에서 `Save and Deploy`를 누릅니다.

## 홈페이지 주소

배포 후:
- 메인: `/`
- Work: `/project.html`
- About: `/about.html`
- Contact: `/contact.html`
- 관리자: `/admin/`

## 관리자 기능

관리자에서는 다음 항목을 수정하도록 구성되어 있습니다.

- 메인 이미지와 홈페이지 이름
- Work 프로젝트 추가·삭제·순서 관리
- About 제목과 설명
- Contact 전화번호·이메일·주소·안내 문구

## 중요한 마지막 연결

`/admin/`의 GitHub 로그인까지 작동하려면 GitHub OAuth 앱과
Cloudflare OAuth Worker를 한 번 연결해야 합니다.

`admin/config.yml`에는 다음 주소가 미리 입력되어 있습니다.

`https://fengshui-interior-auth.ksh833833.workers.dev`

`oauth-worker/` 폴더 안에 인증 Worker 코드가 들어 있습니다.
GitHub OAuth 앱의 Client ID와 Client Secret은 공개 파일에 넣으면 안 되므로
Cloudflare Secret으로 직접 등록해야 합니다.
