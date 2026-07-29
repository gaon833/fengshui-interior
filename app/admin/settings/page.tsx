import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import AdminSecuritySettings from "@/components/admin/AdminSecuritySettings";

export default function SettingsPage() {
  return <><h1>사이트 설정</h1><SiteSettingsForm /><AdminSecuritySettings /></>;
}
