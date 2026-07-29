# v1.0.0 복원 방법

## 가장 안전한 방법
1. 현재 작업 폴더를 별도로 복사하거나 GitHub에 Commit·Push합니다.
2. 이 ZIP의 압축을 풉니다.
3. 압축을 푼 폴더 안의 `app`, `components`, `content`, `public`, `styles`, `package.json` 등 모든 내용물을 선택합니다.
4. 기존 `fengshui-interior` 저장소 최상단에 덮어씁니다.
5. GitHub Desktop에서 변경 내용을 확인합니다.
6. Commit 메시지에 `Restore v1.0.0`을 입력합니다.
7. `Commit` 후 `Push origin`을 누릅니다.
8. Cloudflare Pages 자동 배포가 완료되는지 확인합니다.

## GitHub 기록으로 복원하는 방법
GitHub Desktop의 History에서 정상 작동했던 커밋을 선택한 뒤 `Revert Changes in Commit`을 사용하면 기록을 보존하면서 되돌릴 수 있습니다.

## 주의
이 ZIP의 바깥 폴더 자체를 저장소 안에 넣지 말고, 반드시 ZIP 안의 내용물만 저장소 최상단에 덮어씁니다.
