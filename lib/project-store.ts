import type { Project, ProjectImage } from "@/types/project";

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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
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
