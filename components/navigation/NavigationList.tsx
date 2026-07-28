"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import site from "@/content/site.json";
import { primaryNavigation } from "./navigation-data";

type NavigationListProps = {
  onNavigate?: () => void;
};

type ChannelLinkProps = {
  href: string;
  label: string;
};

function ChannelLink({ href, label }: ChannelLinkProps) {
  const available = Boolean(href && href !== "#");

  if (!available) {
    return (
      <span
        className="navigation-link navigation-channel is-disabled"
        aria-disabled="true"
        title="링크 준비 중"
      >
        {label}
      </span>
    );
  }

  return (
    <a
      className="navigation-link navigation-channel"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}

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

      <span className="navigation-divider" aria-hidden="true" />
      <ChannelLink href={site.blogUrl} label="BLOG" />
      <ChannelLink href={site.instagramUrl} label="INSTAGRAM" />
    </nav>
  );
}
