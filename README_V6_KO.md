# V6 메뉴 통일 + 이미지 확대

반영 내용

## 모든 페이지 메뉴
- 메뉴를 열었을 때 폭 400px
- 로고 위치/크기/글꼴을 고정 사이드바와 동일하게 통일
- about us / contact us / work 시작 위치 동일
- 메뉴 글씨 11px, 굵기 400, 색상 #8f8f8f
- 메뉴 간격 18px
- 하단 회사정보 위치/크기/색상 동일
- 닫기 버튼도 오른쪽 위 동일 위치

## 이미지 영역
- WORK 사진 사이 간격: 70px → 35px
- WORK 오른쪽 끝 여백: 70px → 35px
- 줄어든 여백만큼 2열 이미지 자동 확대
- ABOUT / CONTACT 오른쪽 여백도 35px로 축소해 이미지 확대

Cloudflare 설정은 그대로 사용:
- Build command: npm run build
- Build output directory: out
