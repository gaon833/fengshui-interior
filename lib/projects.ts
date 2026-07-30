import projectsData from "@/content/projects.json";
import type { Project, ProjectCategory, ProjectStatus } from "@/types/project";

export const PROJECT_CATEGORIES = ["ALL", "20", "30", "40", "50", "60", "C"] as const;

function normalizeProject(project: Project): Project {
  return {
    ...project,
    images: [...project.images].sort((a, b) => a.order - b.order),
  };
}

function allProjects(): Project[] {
  return (projectsData as Project[]).map(normalizeProject);
}

function newestProjectFirst(a: Project, b: Project) {
  const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
  const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
  if (aTime !== bTime) return bTime - aTime;
  return (b.order ?? 0) - (a.order ?? 0);
}

export function getProjects(): Project[] {
  return allProjects()
    .filter((project) => project.status === "published")
    .sort(newestProjectFirst);
}

export function getAdminProjects(): Project[] {
  return allProjects().sort((a, b) => a.order - b.order);
}

export function getTrashedProjects(): Project[] {
  return allProjects()
    .filter((project) => project.status === "trash")
    .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getProjects().find((project) => project.slug === slug);
}

export function getProjectById(id: string): Project | undefined {
  return allProjects().find((project) => project.id === id);
}

export function getProjectsByCategory(category?: string): Project[] {
  const projects = getProjects();
  if (!category || category === "ALL") return projects;
  return projects.filter((project) => project.category === category as ProjectCategory);
}

export function filterAdminProjects(query = "", status = "all"): Project[] {
  const normalized = query.trim().toLowerCase();
  return getAdminProjects().filter((project) => {
    const matchesStatus = status === "all" || project.status === (status as ProjectStatus);
    if (!matchesStatus) return false;
    if (!normalized) return true;

    const haystack = [
      project.title,
      project.location,
      project.area,
      project.category,
      project.status,
      ...project.tags,
    ].join(" ").toLowerCase();

    return haystack.includes(normalized);
  });
}

export function searchAdminProjects(query: string): Project[] {
  return filterAdminProjects(query);
}

export function getAdjacentProjects(slug: string) {
  const projects = getProjects();
  const index = projects.findIndex((project) => project.slug === slug);

  if (index < 0 || projects.length === 0) {
    return { prev: null, next: null };
  }

  return {
    prev: projects[(index - 1 + projects.length) % projects.length],
    next: projects[(index + 1) % projects.length],
  };
}
