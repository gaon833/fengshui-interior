# Cloudflare 빌드 오류 수정 1

## 확인된 오류

`components/admin/ContactSettingsForm.tsx`에서 현재 `SocialFooter.tsx`가 제공하지 않는 아래 값을 가져오고 있었습니다.

- `defaultSiteContact`
- `SITE_CONTACT_STORAGE_KEY`
- `SITE_CONTACT_UPDATED_EVENT`
- `SiteContactSettings`

## 수정 내용

연락처 관리 폼이 별도의 오래된 저장 체계를 사용하지 않고, 현재 사이트 전체가 사용하는 통합 설정 체계를 사용하도록 변경했습니다.

- `SITE_SETTINGS_KEY`
- `SITE_SETTINGS_EVENT`
- `defaultSiteSettings`
- `mergeSiteSettings`

따라서 회사명, 주소, 전화번호, 저작권, 블로그, 인스타그램 정보가 `/admin/settings`와 같은 저장 데이터에 연결됩니다.

## 다음 확인

Cloudflare Pages에서 다시 빌드해야 합니다. 첫 오류가 해결된 뒤 다른 타입 오류가 있으면 다음 로그를 기준으로 순차 수정합니다.
