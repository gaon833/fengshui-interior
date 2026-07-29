"use client";
import Image from "next/image";
import { useSiteSettings } from "@/components/site/SiteSettingsProvider";
export default function HomeHero() {
  const site = useSiteSettings();
  return <section className="home-main" aria-label={`${site.brandName} 대표 프로젝트`}><div className="home-main__frame">
    <Image className="home-main__image home-main__image--desktop" src={site.mainImage} alt={`${site.brandName} 대표 프로젝트`} width={1196} height={668} priority quality={82} sizes="calc(100vw - 800px)" unoptimized={site.mainImage.startsWith("data:")} />
    <Image className="home-main__image home-main__image--mobile" src={site.mobileMainImage || site.mainImage} alt={`${site.brandName} 모바일 대표 프로젝트`} width={900} height={1300} priority quality={82} sizes="calc(100vw - 36px)" unoptimized={(site.mobileMainImage || site.mainImage).startsWith("data:")} />
  </div></section>;
}
