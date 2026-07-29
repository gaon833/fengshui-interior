import NavigationList from "@/components/navigation/NavigationList";
import SocialFooter from "@/components/site/SocialFooter";

export default function DesktopSidebar() {
  return (
    <aside className="desktop-sidebar" aria-label="고정 메뉴">
      <NavigationList />
      <SocialFooter />
    </aside>
  );
}
