"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryV2Item, RatioMap } from "../types";

function resolveLayout(width: number) {
  if (width <= 900) return { count: 2, gap: 10 };
  if (width <= 1050) return { count: 3, gap: 12 };
  if (width <= 1280) return { count: 4, gap: 14 };
  return { count: 5, gap: 16 };
}

function fallbackRatio(index: number) {
  const ratios = [1.5, 0.75, 1.15, 0.67, 1.33, 0.82, 1.0];
  return ratios[index % ratios.length];
}

export function useResponsiveMasonry(items: GalleryV2Item[], ratios: RatioMap) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(1600);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(node.clientWidth));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const layout = useMemo(() => resolveLayout(width), [width]);

  const columns = useMemo(() => {
    const result = Array.from({ length: layout.count }, () => [] as GalleryV2Item[]);
    const heights = Array.from({ length: layout.count }, () => 0);
    const columnWidth = Math.max(1, (width - layout.gap * (layout.count - 1)) / layout.count);

    items.forEach((item, index) => {
      let target = 0;
      for (let column = 1; column < heights.length; column += 1) {
        if (heights[column] < heights[target]) target = column;
      }

      const ratio = ratios[item.id] || fallbackRatio(index);
      result[target].push(item);
      heights[target] += columnWidth / Math.max(0.2, ratio) + layout.gap;
    });

    return result;
  }, [items, layout.count, layout.gap, ratios, width]);

  return { containerRef, columns, count: layout.count, gap: layout.gap };
}
