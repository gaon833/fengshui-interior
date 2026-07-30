# v7.4.7

## Gallery UI 재구축
- 기존 Gallery Grid/row-span 표시부를 사용하지 않고 새 `GalleryMasonry` 컴포넌트로 교체했습니다.
- 정상 동작 중인 SCRAP 보드의 CSS column Masonry 구조를 Gallery 전용으로 복사해 적용했습니다.
- 검색, 이미지 확대, 스크랩, 공유, 관리자 삭제 기능은 유지했습니다.
- 가로 column-gap과 세로 카드 margin-bottom을 동일한 CSS 변수로 연결했습니다.
- 반응형 간격 및 열 수: 5열 16px, 4열 14px, 3열 12px, 2열 10px.
