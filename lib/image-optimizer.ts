export type ImageOptimizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/webp" | "image/jpeg" | "image/png";
};

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      image.src = url;
    });
  } finally {
    // revoke after the image has decoded; browsers keep decoded pixels available.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function optimizeImageFile(
  file: File,
  options: ImageOptimizeOptions = {},
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 업로드할 수 있습니다.");
  if (file.size > 30 * 1024 * 1024) throw new Error("원본 이미지는 30MB 이하만 업로드할 수 있습니다.");

  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) throw new Error("이미지 크기를 확인하지 못했습니다.");

  const maxWidth = options.maxWidth ?? 1920;
  const maxHeight = options.maxHeight ?? 1920;
  const scale = Math.min(1, maxWidth / sourceWidth, maxHeight / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("이미지 최적화를 시작하지 못했습니다.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const format = options.format ?? "image/webp";
  const quality = options.quality ?? 0.87;
  return canvas.toDataURL(format, quality);
}
