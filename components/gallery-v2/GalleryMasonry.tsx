"use client";

import { useCallback, useState } from "react";
import GalleryColumn from "./GalleryColumn";
import { useResponsiveMasonry } from "./hooks/useResponsiveMasonry";
import type { GalleryV2Props, RatioMap } from "./types";
import styles from "./styles/GalleryMasonry.module.css";

export default function GalleryMasonry({ items, deleteMode, onOpen, onDelete }: GalleryV2Props) {
  const [ratios, setRatios] = useState<RatioMap>({});
  const { containerRef, columns, count, gap } = useResponsiveMasonry(items, ratios);

  const onRatio = useCallback((id: string, ratio: number) => {
    setRatios((current) => Math.abs((current[id] || 0) - ratio) < 0.001 ? current : { ...current, [id]: ratio });
  }, []);

  return (
    <section
      ref={containerRef}
      className={styles.masonry}
      style={{ "--gallery-v2-gap": `${gap}px`, "--gallery-v2-columns": count } as React.CSSProperties}
      aria-label="인테리어 갤러리 검색 결과"
    >
      {columns.map((columnItems, index) => (
        <GalleryColumn key={`${count}:${index}`} items={columnItems} deleteMode={deleteMode} onOpen={onOpen} onDelete={onDelete} onRatio={onRatio} />
      ))}
    </section>
  );
}
