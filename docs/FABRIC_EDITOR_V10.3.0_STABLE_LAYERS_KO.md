# v10.3.0 안정적인 레이어 유지

- 모든 Fabric 객체에 `data.layerId` 고유 ID를 1회 부여
- 모든 Fabric 객체에 `data.layerName` 고정 이름 저장
- 위치/크기/회전/색상/굵기/투명도/텍스트/필터 수정 시 같은 layerId 유지
- JSON 저장 및 재로드 후에도 동일 layerId와 layerName 유지
- 레이어 목록 React key도 layerId 사용
- 복제/붙여넣기는 새 객체이므로 새 layerId 생성
- 그룹 자체는 새 layerId를 만들고 내부 객체 layerId는 보존
- 그룹 해제 후 내부 객체 기존 layerId 복원
- 실제 요소 삭제 또는 페이지 삭제 때만 레이어가 제거됨
