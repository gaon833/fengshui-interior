import Link from "next/link";

const items = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/projects", label: "프로젝트" },
  { href: "/admin/trash", label: "휴지통" },
  { href: "/admin/settings", label: "사이트 설정" },
  { href: "/admin/backup", label: "백업" },
  { href: "/admin/users", label: "권한" },
];

export default function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="관리자 메뉴">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>{item.label}</Link>
      ))}
    </nav>
  );
}
