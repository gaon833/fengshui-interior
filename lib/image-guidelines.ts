export type ImageGuide = { width: number; height: number; label: string; note?: string };

export const IMAGE_GUIDES = {
  logo: { width: 800, height: 300, label: "가로형", note: "PNG 투명 배경 권장" },
  mainPc: { width: 1920, height: 1080, label: "가로", note: "16:9" },
  mainMobile: { width: 1080, height: 1920, label: "세로", note: "9:16" },
  og: { width: 1200, height: 630, label: "가로", note: "소셜 공유용" },
  favicon: { width: 512, height: 512, label: "정사각형", note: "PNG 권장" },
  story: { width: 1200, height: 1600, label: "세로", note: "3:4" },
  process: { width: 1600, height: 900, label: "가로", note: "16:9" },
  projectPc: { width: 1600, height: 1000, label: "가로", note: "8:5" },
  projectMobile: { width: 1000, height: 1500, label: "세로", note: "2:3" },
  detailLandscape: { width: 1600, height: 1000, label: "가로", note: "8:5" },
  detailPortrait: { width: 1000, height: 1500, label: "세로", note: "2:3" },
} satisfies Record<string, ImageGuide>;

export const guideText = (guide: ImageGuide) => `${guide.label} (${guide.width} × ${guide.height}px${guide.note ? ` · ${guide.note}` : ""})`;

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
  const expectedRatio = guide.width / guide.height;
  const actualRatio = actual.width / actual.height;
  const difference = Math.abs(actualRatio - expectedRatio) / expectedRatio;
  if (difference <= 0.08) return true;
  return window.confirm(`이미지 비율이 권장 비율과 다릅니다.\n\n권장: ${guide.width} × ${guide.height}px\n현재: ${actual.width} × ${actual.height}px\n\n잘리거나 여백이 생길 수 있습니다. 그래도 업로드할까요?`);
}

export async function confirmMixedDetailImage(file: File): Promise<boolean> {
  const actual = await readImageSize(file);
  const ratio = actual.width / actual.height;
  const landscape = IMAGE_GUIDES.detailLandscape.width / IMAGE_GUIDES.detailLandscape.height;
  const portrait = IMAGE_GUIDES.detailPortrait.width / IMAGE_GUIDES.detailPortrait.height;
  const ok = Math.min(Math.abs(ratio-landscape)/landscape, Math.abs(ratio-portrait)/portrait) <= 0.1;
  if (ok) return true;
  return window.confirm(`상세 이미지 비율이 권장 비율과 다릅니다.\n\n가로 권장: 1600 × 1000px\n세로 권장: 1000 × 1500px\n현재: ${actual.width} × ${actual.height}px\n\n그래도 업로드할까요?`);
}
