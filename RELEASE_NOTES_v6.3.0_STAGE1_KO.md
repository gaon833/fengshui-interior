# 풍수 인테리어 v6.3.0 — AI GALLERY 1차

## 구현 범위

- 관리자 GALLERY 사진 선택 즉시 Workers AI 자동 분석
- 공간, 스타일, 색상, 자재, 특징, 검색 키워드 자동 생성
- 분석 결과를 D1 `gallery_ai_analysis` 테이블에 저장
- 분석 상태 `analyzing / ready / failed` 기록
- AI 또는 D1 연결 상태를 관리자 화면에서 확인
- 분석 완료 및 D1 저장 확인 후에만 GALLERY 이미지 등록 가능
- AI 분석 실패 시 재분석 가능
- 관리자 로그인 세션을 12시간으로 통일

## Cloudflare 바인딩

- Workers AI: `AI`
- D1 Database: `DB`

## 다음 단계

2차에서 D1에 저장된 분석 데이터를 이용한 자연어 검색과 유사어 검색을 연결합니다.
