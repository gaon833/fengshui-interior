export const STORY_CONTENT_KEY = "fengshui-story-content-v1";
export const PROCESS_CONTENT_KEY = "fengshui-process-content-v1";
export const PAGE_CONTENT_EVENT = "fengshui-page-content-updated";

export type StoryContent = {
  pageTitle: string;
  introduction: string;
  image: string;
  philosophyTitle: string;
  philosophyBody: string;
};

export type ProcessStep = { id: string; title: string; description: string };
export type ProcessContent = {
  pageTitle: string;
  introduction: string;
  image: string;
  steps: ProcessStep[];
};

export const defaultStoryContent: StoryContent = {
  pageTitle: "OUR STORY",
  introduction: "우리가 어떤 회사인지, 브랜드 철학과 풍수 인테리어의 이야기를 소개합니다.",
  image: "",
  philosophyTitle: "공간과 사람의 조화",
  philosophyBody: "공간의 흐름과 사람의 생활을 함께 고려하는 인테리어 스튜디오입니다.",
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
  if (file.size > 3 * 1024 * 1024) throw new Error("이미지는 3MB 이하만 업로드할 수 있습니다.");
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}
