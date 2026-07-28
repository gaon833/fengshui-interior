import BrandLogo from "@/components/brand/BrandLogo";
import NavigationList from "@/components/navigation/NavigationList";
import site from "@/content/site.json";
export default function DesktopSidebar() {
  return <aside className="desktop-sidebar" aria-label="고정 메뉴">
    <BrandLogo className="sidebar-logo" />
    <NavigationList />
    <div className="sidebar-info">{site.brandName}<br/>Seoul, Republic of Korea<br/>{site.contact.phone || "02-0000-0000"}</div>
  </aside>;
}
