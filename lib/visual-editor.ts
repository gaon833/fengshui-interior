export type EditorMode = "desktop" | "mobile";
export type VisualElementType = "text" | "image" | "rect" | "line";

export type ElementLayout = {
  x: number; y: number; width: number; height: number; rotate: number; z: number;
};

export type VisualElement = {
  id: string;
  type: VisualElementType;
  text?: string;
  src?: string;
  color?: string;
  background?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  radius?: number;
  objectFit?: "cover" | "contain";
  lineOrientation?: "horizontal" | "vertical";
  layouts: Record<EditorMode, ElementLayout>;
};

export type VisualPage = {
  id: string;
  name: string;
  desktop: { width: number; height: number };
  mobile: { width: number; height: number };
  elements: VisualElement[];
};

export type VisualDocument = { version: 1; pages: VisualPage[] };

export const emptyVisualDocument = (): VisualDocument => ({
  version: 1,
  pages: [{ id: cryptoId("page"), name: "1 PAGE", desktop: { width: 1420, height: 1000 }, mobile: { width: 390, height: 693 }, elements: [] }],
});

export function cryptoId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultLayout(type: VisualElementType, mode: EditorMode): ElementLayout {
  const mobile = mode === "mobile";
  if (type === "text") return { x: mobile ? 28 : 80, y: mobile ? 36 : 70, width: mobile ? 320 : 420, height: mobile ? 100 : 130, rotate: 0, z: 10 };
  if (type === "image") return { x: mobile ? 28 : 620, y: mobile ? 180 : 130, width: mobile ? 330 : 620, height: mobile ? 260 : 420, rotate: 0, z: 5 };
  if (type === "rect") return { x: mobile ? 40 : 180, y: mobile ? 200 : 180, width: mobile ? 300 : 420, height: mobile ? 180 : 260, rotate: 0, z: 1 };
  return { x: mobile ? 45 : 180, y: mobile ? 340 : 500, width: mobile ? 300 : 520, height: mobile ? 4 : 4, rotate: 0, z: 20 };
}

export function clonePage(page: VisualPage): VisualPage {
  const idMap = new Map<string,string>();
  const elements = page.elements.map((el) => {
    const id = cryptoId(el.type); idMap.set(el.id,id);
    return { ...structuredClone(el), id };
  });
  return { ...structuredClone(page), id: cryptoId("page"), name: `${page.name} COPY`, elements };
}

export function collectVisualImages(doc?: VisualDocument | null): string[] {
  if (!doc?.pages) return [];
  return doc.pages.flatMap((p) => p.elements.filter((e) => e.type === "image" && e.src).map((e) => e.src as string));
}
