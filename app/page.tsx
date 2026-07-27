import SiteChrome from "@/components/SiteChrome"; import { site } from "@/content/data";
export default function HomePage(){return <><SiteChrome/><main className="homePage"><img src={site.heroImage} alt="풍수 인테리어 메인 이미지"/></main></>}
