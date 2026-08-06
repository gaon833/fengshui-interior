export type ImageGuide = {
  width?: number;
  height?: number;
  label: string;
  note?: string;
  guide?: string;
  orientation?: "landscape" | "portrait" | "square" | "any";
};

export const IMAGE_GUIDES = {
  logo: { label: "로고", guide: "권장 업로드 1600px 이상 · PNG 투명 배경 권장", orientation: "landscape" },
  mainPc: { label: "가로", guide: "고화질 원본 업로드 · 자동 최적화", orientation: "landscape" },
  mainMobile: { label: "세로", guide: "고화질 원본 업로드 · 자동 최적화", orientation: "portrait" },
  og: { label: "가로", guide: "고화질 원본 업로드 · 자동 최적화", orientation: "landscape" },
  favicon: { label: "정사각형", guide: "권장 업로드 1024 × 1024px · PNG 권장", orientation: "square" },
  story: { label: "세로", guide: "고화질 원본 업로드 · 자동 최적화", orientation: "portrait" },
  process: { label: "가로", guide: "고화질 원본 업로드 · 자동 최적화", orientation: "landscape" },
  projectPc: { label: "가로", guide: "고화질 원본 업로드 · 자동 최적화", orientation: "landscape" },
  projectMobile: { label: "세로", guide: "고화질 원본 업로드 · 자동 최적화", orientation: "portrait" },
  detailLandscape: { label: "가로", guide: "고화질 원본 업로드 · 자동 최적화", orientation: "landscape" },
  detailPortrait: { label: "세로", guide: "고화질 원본 업로드 · 자동 최적화", orientation: "portrait" },
} satisfies Record<string, ImageGuide>;

export const guideText = (guide: ImageGuide) => guide.guide ?? `${guide.label}${guide.width && guide.height ? ` (${guide.width} × ${guide.height}px)` : ""}${guide.note ? ` · ${guide.note}` : ""}`;

export async function readImageSize(file: File): Promise<{width:number;height:number}> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("이미지 크기를 확인하지 못했습니다."));
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}

export async function confirmImageRatio(file: File, guide: ImageGuide): Promise<boolean> {
  const actual = await readImageSize(file);
  const orientation = actual.width === actual.height ? "square" : actual.width > actual.height ? "landscape" : "portrait";
  if (!guide.orientation || guide.orientation === "any" || orientation === guide.orientation) return true;
  return window.confirm(`선택한 이미지의 방향이 권장 방향과 다릅니다.\n\n권장: ${guide.label}\n현재: ${actual.width} × ${actual.height}px\n\n그래도 업로드할까요?`);
}

export async function confirmMixedDetailImage(_file: File): Promise<boolean> {
  return true;
}
