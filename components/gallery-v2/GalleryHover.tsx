"use client";

import ScrapButton from "@/components/project/ScrapButton";
import ShareIconButton from "@/components/project/ShareIconButton";
import type { GalleryV2Item } from "./types";
import styles from "./styles/GalleryHover.module.css";

type Props = { item: GalleryV2Item };

export default function GalleryHover({ item }: Props) {
  return (
    <div className={styles.controls} aria-label="이미지 작업">
      <ScrapButton
        className={styles.heart}
        item={{
          id: `gallery:${item.id}`,
          kind: "image",
          projectSlug: item.projectSlug || "gallery",
          projectTitle: item.projectTitle || item.title,
          src: item.src,
          alt: item.title,
        }}
      />
      <ShareIconButton
        className={styles.share}
        projectSlug={item.projectSlug}
        projectTitle={item.projectTitle || item.title}
        fallbackPath="/gallery"
      />
    </div>
  );
}
