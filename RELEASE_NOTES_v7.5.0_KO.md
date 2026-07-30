# v7.5.0

- SCRAP 피드백 팝업을 Gallery 카드 내부가 아닌 document.body Portal로 분리
- 카드 overflow/isolation/transform stacking context 위로 일부 이미지가 노출되던 문제 수정
- 팝업 표시 중 body 스크롤 잠금으로 Gallery 폭이 재계산되던 문제 제거
- Gallery V2 Masonry 배치와 기존 SCRAP 자동 종료 1.8초 유지
