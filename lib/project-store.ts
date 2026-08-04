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

export function mergeProjects(base: Project[], overrides: Project[]): Project[] {
  const map = new Map<string, Project>();
  for (const project of base) map.set(project.id, project);
  for (const project of overrides) map.set(project.id, project);
  return normalizeProjects([...map.values()]);
}

export function readStoredProjects(fallback: Project[]): Project[] {
  if (typeof window === "undefined") return normalizeProjects(fallback);
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    return raw ? mergeProjects(fallback, JSON.parse(raw) as Project[]) : normalizeProjects(fallback);
  } catch {
    return normalizeProjects(fallback);
  }
}

export function cacheStoredProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  const normalized = normalizeProjects(projects);
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(PROJECTS_EVENT));
}

async function readProjectResponse(response: Response): Promise<{ projects: Project[]; hiddenIds: string[] }> {
  const data = await response.json().catch(() => null) as { ok?: boolean; projects?: Project[]; hiddenIds?: string[]; error?: string } | null;
  if (!response.ok || !data?.ok || !Array.isArray(data.projects)) throw new Error(data?.error || "프로젝트 서버 응답이 올바르지 않습니다.");
  return { projects: data.projects, hiddenIds: Array.isArray(data.hiddenIds) ? data.hiddenIds : [] };
}

export async function fetchServerProjects(fallback: Project[], admin = false): Promise<Project[]> {
  if (typeof window === "undefined") return normalizeProjects(fallback);
  try {
    const response = await fetch(admin ? "/api/admin/projects" : "/api/projects", {
      method: "GET",
      credentials: admin ? "include" : "same-origin",
      cache: "no-store",
    });
    let remote = await readProjectResponse(response);
    if (admin && remote.projects.length === 0 && window.localStorage.getItem(PROJECTS_STORAGE_KEY)) {
      const legacy = readStoredProjects(fallback);
      const migrated = await syncProjectsToServer(legacy);
      if (migrated.length) remote = { projects: migrated, hiddenIds: [] };
    }
    const visibleBase = admin || remote.hiddenIds.length === 0 ? fallback : fallback.filter((project) => !remote.hiddenIds.includes(project.id));
    const merged = mergeProjects(visibleBase, remote.projects);
    cacheStoredProjects(merged);
    return merged;
  } catch {
    return readStoredProjects(fallback);
  }
}

export async function saveProjectToServer(project: Project): Promise<Project> {
  const response = await fetch("/api/admin/projects", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ project }),
  });
  const data = await response.json().catch(() => null) as { ok?: boolean; project?: Project; error?: string } | null;
  if (!response.ok || !data?.ok || !data.project) throw new Error(data?.error || "프로젝트 서버 저장에 실패했습니다.");
  return data.project;
}

export async function syncProjectsToServer(projects: Project[]): Promise<Project[]> {
  const response = await fetch("/api/admin/projects", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ projects: normalizeProjects(projects) }),
  });
  return (await readProjectResponse(response)).projects;
}

export function saveStoredProjects(projects: Project[]) {
  const normalized = normalizeProjects(projects);
  cacheStoredProjects(normalized);
  void syncProjectsToServer(normalized).then((stored) => {
    if (stored.length) cacheStoredProjects(mergeProjects(normalized, stored));
  }).catch(() => undefined);
}

export function fileToDataUrl(file: File): Promise<string> {
  return optimizeImageFile(file, { maxWidth: 2400, maxHeight: 3200, quality: 0.90 });
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
