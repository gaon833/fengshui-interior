# v4.3.0 공통 관리자 비밀번호

- 로그인 화면의 최초 비밀번호 안내 문구 제거
- 관리자 비밀번호를 브라우저 localStorage가 아닌 Cloudflare KV에 공통 저장
- 한 기기에서 비밀번호 변경 시 모든 기기에 동일하게 적용
- HttpOnly 세션 쿠키로 로그인 유지
- 로그인 5회 실패 시 IP별 5분 잠금
- 최초 비밀번호는 1234이며 로그인 화면에는 표시하지 않음
- 운영 시작 후 관리자 설정에서 6자 이상의 비밀번호로 변경 권장

## Cloudflare 필수 설정

1. Workers & Pages → KV에서 namespace 생성
2. Pages 프로젝트 → Settings → Bindings에서 KV namespace 연결
3. 변수 이름을 `ADMIN_AUTH`로 지정
4. 새 배포 실행
