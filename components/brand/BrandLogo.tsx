"use client";
import Image from "next/image";
import Link from "next/link";
import { useSiteSettings } from "@/components/site/SiteSettingsProvider";

type BrandLogoProps = { className?: string };
export default function BrandLogo({ className = "" }: BrandLogoProps) {
  const site = useSiteSettings();
  return <Link className={`brand-logo ${className}`.trim()} href="/" aria-label="홈으로 이동"><Image src={site.logo} alt={site.brandName} width={420} height={240} priority unoptimized={site.logo.startsWith("data:")} /></Link>;
}
