import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import AdminSecuritySettings from "@/components/admin/AdminSecuritySettings";
import Link from "next/link";

export default function SettingsPage() {
  return <><div className="admin-heading"><div><h1>사이트 설정</h1></div><Link className="admin-filter-button" href="/?adminDelete=1">홈페이지에서 메인 이미지 삭제</Link></div><SiteSettingsForm /><AdminSecuritySettings /></>;
}
