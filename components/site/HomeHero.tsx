"use client";
import Image from "next/image";
import { useSiteSettings } from "@/components/site/SiteSettingsProvider";
import { defaultSiteSettings, SITE_SETTINGS_EVENT, SITE_SETTINGS_KEY } from "@/lib/site-settings";
import { useAdminDeleteMode } from "@/lib/admin-delete-mode";
import dynamic from "next/dynamic";
import { confirmVisualDelete } from "@/lib/confirm-visual-delete";
const AdminDeleteChrome = dynamic(() => import("@/components/admin-delete/AdminDeleteChrome").then((mod) => mod.AdminDeleteChrome));
const AdminDeleteButton = dynamic(() => import("@/components/admin-delete/AdminDeleteChrome").then((mod) => mod.AdminDeleteButton));

export default function HomeHero() {
  const site = useSiteSettings();
  const deleteMode = useAdminDeleteMode();
  const resetImage = (field: "mainImage" | "mobileMainImage") => {
    if (!confirmVisualDelete(field === "mainImage" ? "PC 메인 이미지를 기본 이미지로 복원하시겠습니까?" : "모바일 메인 이미지를 기본 이미지로 복원하시겠습니까?", "이미지 영역은 유지되고 기본 이미지로 돌아갑니다.")) return;
    const raw = window.localStorage.getItem(SITE_SETTINGS_KEY);
    const current = raw ? JSON.parse(raw) : site;
    const next = { ...current, [field]: defaultSiteSettings[field] };
    window.localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(SITE_SETTINGS_EVENT));
  };
  return <>
    {deleteMode.active && <AdminDeleteChrome label="메인 이미지 삭제" />}
    <section className={`home-main ${deleteMode.active ? "is-admin-delete" : ""}`} aria-label={`${site.brandName} 대표 프로젝트`}><div className="home-main__frame">
      <div className="admin-delete-image-wrap admin-delete-desktop"><Image className="home-main__image home-main__image--desktop" src={site.mainImage} alt={`${site.brandName} 대표 프로젝트`} width={1196} height={668} priority quality={82} sizes="calc(100vw - 800px)" unoptimized={site.mainImage.startsWith("data:")} />{deleteMode.active && <AdminDeleteButton label="PC 메인 이미지 초기화" onDelete={() => resetImage("mainImage")} />}</div>
      <div className="admin-delete-image-wrap admin-delete-mobile"><Image className="home-main__image home-main__image--mobile" src={site.mobileMainImage || site.mainImage} alt={`${site.brandName} 모바일 대표 프로젝트`} width={900} height={1300} priority quality={82} sizes="calc(100vw - 36px)" unoptimized={(site.mobileMainImage || site.mainImage).startsWith("data:")} />{deleteMode.active && <AdminDeleteButton label="모바일 메인 이미지 초기화" onDelete={() => resetImage("mobileMainImage")} />}</div>
    </div></section>
  </>;
}
