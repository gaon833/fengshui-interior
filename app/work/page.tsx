import SiteChrome from "@/components/SiteChrome";
import WorkBrowser from "@/components/WorkBrowser";
import { projects } from "@/content/data";

export default function WorkPage() {
  return (
    <>
      <SiteChrome />
      <main className="workPage">
        <WorkBrowser projects={projects} />
      </main>
    </>
  );
}
