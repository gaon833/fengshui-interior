"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavigation } from "./navigation-data";

type NavigationListProps = {
  onNavigate?: () => void;
};

export default function NavigationList({ onNavigate }: NavigationListProps) {
  const pathname = usePathname();

  return (
    <nav className="navigation-list" aria-label="주요 메뉴">
      {primaryNavigation.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            className={`navigation-link${active ? " is-active" : ""}`}
            href={item.href}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
