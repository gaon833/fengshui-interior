# v4.0.1 최종 검증 보고서

## 통과
- ZIP 압축 해제 정상
- `scripts/validate-content.mjs` 실행 성공
- 프로젝트 60개 확인
- 이미지 240개 확인
- JSON 콘텐츠 검사 통과
- 충돌 마커 없음
- 정적 export 관련 파일 존재 및 구조 확인

## 경고
- blogUrl, instagramUrl, kakaoUrl, naverTalkUrl이 아직 실제 운영 URL로 설정되지 않음

## 실행 검증 제한
- 현재 검증 환경의 기본 npm 저장소에서 `@types/node`가 404로 제공되지 않음
- 공식 npm registry 직접 설치도 네트워크 제한으로 시간 초과
- 따라서 `npm install`, `npm run typecheck`, `npm run build`, 브라우저 E2E 테스트는 이 환경에서 완료하지 못함

## 반드시 배포 전에 확인할 명령
```bash
npm install
npm run validate
npm run typecheck
npm run build
```

## 운영상 중요 제한
현재 관리자 설정과 프로젝트 데이터는 브라우저 localStorage 기반이다. 같은 브라우저에서는 유지되지만 다른 기기와 일반 방문자에게 공통 저장되는 서버형 CMS는 아니다. 운영용 공통 관리자 저장이 필요하면 Cloudflare D1/R2 또는 별도 백엔드 연결이 필요하다.
