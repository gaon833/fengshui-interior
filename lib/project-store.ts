import type { Project, ProjectImage } from "@/types/project";
import { optimizeImageFile } from "@/lib/image-optimizer";

export const PROJECTS_STORAGE_KEY = "fengshui-admin-projects-v3";
export const PROJECTS_EVENT = "fengshui-projects-updated";

export function normalizeProjects(projects: Project[]): Project[] {
  return projects.map((project) => ({
    ...project,
    images: [...(project.images ?? [])].sort((a, b) => a.order - b.order),
  })).sort((a, b) => a.order - b.order);
}

export function readStoredProjects(fallback: Project[]): Project[] {
  if (typeof window === "undefined") return normalizeProjects(fallback);
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    return raw ? normalizeProjects(JSON.parse(raw) as Project[]) : normalizeProjects(fallback);
  } catch {
    return normalizeProjects(fallback);
  }
}

export function saveStoredProjects(projects: Project[]) {
  const normalized = normalizeProjects(projects);
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(PROJECTS_EVENT));
}

export function fileToDataUrl(file: File): Promise<string> {
  return optimizeImageFile(file, { maxWidth: 1600, maxHeight: 2400, quality: 0.84 });
}


export function makeProjectImage(src: string, title: string, order: number): ProjectImage {
  return {
    id: `image-${Date.now()}-${order}-${Math.random().toString(36).slice(2, 8)}`,
    src,
    alt: `${title || "프로젝트"} 상세 이미지 ${order}`,
    order,
    isCover: false,
  };
}
