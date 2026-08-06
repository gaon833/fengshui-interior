import { optimizeImageFile } from "@/lib/image-optimizer";
import { fetchCmsContent, saveCmsContent } from "@/lib/cms-content-client";

export const STORY_CONTENT_KEY = "fengshui-story-content-v1";
export const PROCESS_CONTENT_KEY = "fengshui-process-content-v1";
export const PAGE_CONTENT_EVENT = "fengshui-page-content-updated";

export type FreeformLayout = { x:number; y:number; w:number; h:number; z:number; page?:number };
export type FreeformBlock = {
  id:string; type:"text"|"image"|"rect"|"hline"|"vline"; text?:string; src?:string; alt?:string;
  fontSize?:number; align?:"left"|"center"|"right"; color?:string; fit?:"cover"|"contain";
  strokeColor?:string; strokeWidth?:number; fillColor?:string; opacity?:number; radius?:number;
  layouts:{desktop:FreeformLayout;mobile:FreeformLayout};
};

export type StoryContent = {
  pageTitle: string;
  introduction: string;
  image: string;
  philosophyTitle: string;
  philosophyBody: string;
  blocks?: FreeformBlock[];
};

export type ProcessStep = { id: string; title: string; description: string };
export type ProcessContent = {
  pageTitle: string;
  introduction: string;
  image: string;
  steps: ProcessStep[];
  blocks?: FreeformBlock[];
};

export const defaultStoryContent: StoryContent = {
  pageTitle: "OUR STORY",
  introduction: "우리가 어떤 회사인지, 브랜드 철학과 풍수 인테리어의 이야기를 소개합니다.",
  image: "",
  philosophyTitle: "공간과 사람의 조화",
  philosophyBody: "공간의 흐름과 사람의 생활을 함께 고려하는 인테리어 스튜디오입니다.",
  blocks: [],
};

export const defaultProcessContent: ProcessContent = {
  pageTitle: "PROCESS",
  introduction: "방문 상담부터 현장 실측, 디자인, 시공과 완료까지의 진행 과정을 안내합니다.",
  image: "",
  steps: [
    { id: "step-1", title: "상담", description: "공간과 생활 방식, 원하는 방향을 함께 확인합니다." },
    { id: "step-2", title: "현장 진단", description: "현장을 살펴보고 공간의 흐름과 필요한 개선점을 정리합니다." },
    { id: "step-3", title: "디자인 및 시공", description: "확정된 방향을 바탕으로 디자인과 시공을 진행합니다." },
  ],
  blocks: [],
};

export function readLocalContent<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocalContent<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(PAGE_CONTENT_EVENT));
}

export async function imageFileToDataUrl(file: File): Promise<string> {
  return optimizeImageFile(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.87 });
}

export async function fetchPageContent<T>(serverKey: "story" | "process", localKey: string, fallback: T, admin = false): Promise<T> {
  const local = readLocalContent(localKey, fallback);
  const remote = await fetchCmsContent<T>(serverKey, local, admin);
  try { window.localStorage.setItem(localKey, JSON.stringify(remote)); } catch {}
  return remote;
}

export async function savePageContent<T>(serverKey: "story" | "process", localKey: string, value: T): Promise<T> {
  const stored = await saveCmsContent<T>(serverKey, value);
  saveLocalContent(localKey, stored);
  return stored;
}
