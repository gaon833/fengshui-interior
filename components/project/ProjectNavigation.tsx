import Link from "next/link";
import type { Project } from "@/types/project";

export default function ProjectNavigation({ prev, next }: { prev: Project | null; next: Project | null }) {
  return (
    <nav className="project-navigation" aria-label="이전·다음 프로젝트">
      <div>
        {prev && (
          <Link className="prev" href={`/project/${prev.slug}`}>
            <span className="nav-arrow nav-arrow--prev" aria-hidden="true" />
            <span>PREV</span>
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link className="next" href={`/project/${next.slug}`}>
            <span>NEXT</span>
            <span className="nav-arrow nav-arrow--next" aria-hidden="true" />
          </Link>
        )}
      </div>
    </nav>
  );
}
