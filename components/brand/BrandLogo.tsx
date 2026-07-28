import Image from "next/image";
import Link from "next/link";
import site from "@/content/site.json";

type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <Link className={`brand-logo ${className}`.trim()} href="/" aria-label="홈으로 이동">
      <Image
        src={site.logo}
        alt={site.brandName}
        width={420}
        height={240}
        priority
      />
    </Link>
  );
}
