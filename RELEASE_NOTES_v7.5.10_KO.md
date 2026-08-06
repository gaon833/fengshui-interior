# v7.5.10 R2 Gallery Direct Save

- GALLERY 저장 경로를 단순화했습니다.
- 브라우저의 별도 `/api/admin/media-upload` 선행 업로드 대신 `/api/admin/gallery`가 최적화된 이미지를 직접 받아 `PROJECT_MEDIA` R2 버킷에 저장합니다.
- 한 번에 여러 이미지를 큰 JSON으로 보내지 않고 1장씩 순차 저장하여 실패 위치를 명확히 했습니다.
- 서버에서 `PROJECT_MEDIA` 바인딩이 없으면 즉시 503 오류를 반환합니다.
- 저장 후 반환된 이미지 주소가 `/api/project-media/...` 형식인지 검증하여 R2 저장이 확인되지 않으면 관리자 목록에 성공으로 반영하지 않습니다.
- D1에는 base64 원본 대신 R2 이미지 경로가 저장됩니다.

## 확인 방법
배포 후 관리자 GALLERY에서 새 이미지 1장을 선택하고 태그 지정 후 저장합니다. 성공 메시지가 나온 뒤 R2 `fengshui-media` Objects에 파일이 1개 이상 보여야 합니다.
