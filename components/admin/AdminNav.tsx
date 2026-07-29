"use client";

import Link from "next/link";
import { logoutAdmin } from "@/lib/admin-auth";

const primaryItems = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/studio", label: "OUR STORY 관리" },
  { href: "/admin/service", label: "PROCESS 관리" },
  { href: "/admin/projects", label: "PROJECTS 관리" },
  { href: "/admin/contact", label: "CONSULTATION 관리" },
];
const systemItems = [
  { href: "/admin/trash", label: "휴지통" },
  { href: "/admin/settings", label: "사이트 설정" },
  { href: "/admin/backup", label: "백업" },
  { href: "/admin/users", label: "사용자 권한" },
];

export default function AdminNav() {
  return <nav className="admin-nav" aria-label="관리자 메뉴">
    <div className="admin-nav-group">{primaryItems.map((item)=><Link key={item.href} href={item.href}>{item.label}</Link>)}</div>
    <div className="admin-nav-divider" aria-hidden="true" />
    <div className="admin-nav-group">{systemItems.map((item)=><Link key={item.href} href={item.href}>{item.label}</Link>)}</div>
    <button className="admin-nav-logout" type="button" onClick={logoutAdmin}>로그아웃</button>
  </nav>;
}
