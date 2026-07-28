import Link from "next/link";
import type { Project } from "@/types/project";

export default function ProjectNavigation({
  prev,
  next,
}: {
  prev: Project | null;
  next: Project | null;
}) {
  return (
    <nav className="project-navigation" aria-label="이전·다음 프로젝트">
      <div>
        {prev && <Link href={`/project/${prev.slug}`}>⟵&nbsp;&nbsp; PREV</Link>}
      </div>
      <div>
        {next && <Link href={`/project/${next.slug}`}>NEXT &nbsp;&nbsp;⟶</Link>}
      </div>
    </nav>
  );
}
