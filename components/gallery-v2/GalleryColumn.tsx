"use client";

import GalleryCard from "./GalleryCard";
import type { GalleryV2Item } from "./types";
import styles from "./styles/GalleryMasonry.module.css";

type Props = {
  items: GalleryV2Item[];
  deleteMode: boolean;
  onOpen: (item: GalleryV2Item) => void;
  onDelete: (item: GalleryV2Item) => void;
  onRatio: (id: string, ratio: number) => void;
};

export default function GalleryColumn({ items, deleteMode, onOpen, onDelete, onRatio }: Props) {
  return (
    <div className={styles.column}>
      {items.map((item) => (
        <GalleryCard key={item.id} item={item} deleteMode={deleteMode} onOpen={onOpen} onDelete={onDelete} onRatio={onRatio} />
      ))}
    </div>
  );
}
