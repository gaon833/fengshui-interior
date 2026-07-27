import Link from "next/link";
import MenuOverlay from "./MenuOverlay";

export default function SiteChrome() {
  return (
    <>
      <header className="siteHeader">
        <MenuOverlay placement="left" />
        <Link href="/" className="brand">풍수 인테리어</Link>
      </header>
    </>
  );
}
