# v10.5.0 이동 / Delete 키

- 이미지, 텍스트, 선, 사각형, 원, 타원, 삼각형, 별, SVG, 드로잉 모두 동일하게 마우스 드래그 이동 가능
- 로드된 기존 객체도 selectable/evented/lockMovement 해제 상태로 정규화
- 사용자가 '잠금'을 켠 객체만 이동 불가
- 선택 요소는 Delete 또는 Backspace 키로 삭제
- 다중 선택 상태에서도 Delete/Backspace로 한 번에 삭제
- input / textarea / select / contenteditable / Fabric 텍스트 직접 편집 중에는 키 삭제 기능이 개입하지 않음
- 기존 삭제 버튼도 그대로 유지
