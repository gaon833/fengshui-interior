import type { GalleryItem } from "@/lib/gallery-store";

export type GalleryV2Item = GalleryItem;

export type GalleryV2Props = {
  items: GalleryV2Item[];
  deleteMode: boolean;
  onOpen: (item: GalleryV2Item) => void;
  onDelete: (item: GalleryV2Item) => void;
};

export type RatioMap = Record<string, number>;
