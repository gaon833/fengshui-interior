"use client";

import { memo, type SyntheticEvent } from "react";
import { AdminDeleteButton } from "@/components/admin-delete/AdminDeleteChrome";
import GalleryHover from "./GalleryHover";
import type { GalleryV2Item } from "./types";
import styles from "./styles/GalleryCard.module.css";

type Props = {
  item: GalleryV2Item;
  deleteMode: boolean;
  onOpen: (item: GalleryV2Item) => void;
  onDelete: (item: GalleryV2Item) => void;
  onRatio: (id: string, ratio: number) => void;
};

function GalleryCard({ item, deleteMode, onOpen, onDelete, onRatio }: Props) {
  const reportRatio = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      onRatio(item.id, image.naturalWidth / image.naturalHeight);
    }
  };

  return (
    <article className={styles.card} aria-label={item.title}>
      <div
        className={styles.media}
        role="button"
        tabIndex={deleteMode ? -1 : 0}
        aria-label={`${item.title} 크게 보기`}
        onClick={() => { if (!deleteMode) onOpen(item); }}
        onKeyDown={(event) => {
          if (!deleteMode && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onOpen(item);
          }
        }}
      >
        <img src={item.src} alt={item.title} loading="lazy" decoding="async" onLoad={reportRatio} />
        {deleteMode
          ? <AdminDeleteButton label={`${item.title} 삭제`} onDelete={() => onDelete(item)} />
          : <GalleryHover item={item} />}
      </div>
    </article>
  );
}

export default memo(GalleryCard);
