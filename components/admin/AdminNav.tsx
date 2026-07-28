import Link from "next/link";

const primaryItems = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/projects", label: "PROJECT 관리" },
  { href: "/admin/service", label: "SERVICE 관리" },
  { href: "/admin/studio", label: "STUDIO 관리" },
  { href: "/admin/contact", label: "CONTACT 관리" },
];

const systemItems = [
  { href: "/admin/trash", label: "휴지통" },
  { href: "/admin/settings", label: "사이트 설정" },
  { href: "/admin/backup", label: "백업" },
  { href: "/admin/users", label: "사용자 권한" },
];

export default function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="관리자 메뉴">
      <div className="admin-nav-group">
        {primaryItems.map((item) => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}
      </div>
      <div className="admin-nav-divider" aria-hidden="true" />
      <div className="admin-nav-group">
        {systemItems.map((item) => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}
      </div>
    </nav>
  );
}
