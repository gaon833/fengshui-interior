# Polotno 자유배치 편집기 v8.1.0

OUR STORY / PROCESS 전용.

- Polotno 4.5.x (React 19)
- 자유 X/Y 이동, 크기조절, 회전, 레이어, Undo/Redo, 도형/선/텍스트, 멀티페이지는 Polotno SDK 기능 사용
- 기본 Upload 탭은 제거: base64 누적 방지
- 상단 `고화질 이미지` 버튼은 기존 1920px / WebP 87% 최적화 사용
- 저장 시 Polotno JSON을 D1에 저장하고 data URL 이미지는 R2 URL로 변환
- 삭제/교체된 Polotno 관리 이미지는 R2 정리 대상
- Desktop/Mobile 디자인을 별도로 저장
- 공개 페이지는 Polotno Workspace를 viewer 역할로 렌더링

## 필수 설정
Cloudflare 환경변수에 `NEXT_PUBLIC_POLOTNO_KEY`를 등록하세요. Polotno production 사용은 공식 구독/라이선스가 필요합니다.
