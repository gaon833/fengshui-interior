"use client";

import ScrapButton from "@/components/project/ScrapButton";
import ShareIconButton from "@/components/project/ShareIconButton";
import { AdminDeleteButton } from "@/components/admin-delete/AdminDeleteChrome";
import type { GalleryItem } from "@/lib/gallery-store";

type Props = {
  items: GalleryItem[];
  deleteMode: boolean;
  onOpen: (item: GalleryItem) => void;
  onDelete: (item: GalleryItem) => void;
};

/**
 * SCRAP 보드의 검증된 CSS column Masonry 구조를 Gallery 전용으로 분리한 컴포넌트입니다.
 * 카드 높이 계산이나 grid-row span을 사용하지 않으며 이미지 원본 비율을 그대로 유지합니다.
 */
export default function GalleryMasonry({ items, deleteMode, onOpen, onDelete }: Props) {
  return (
    <section className="gallery-scrap-masonry" aria-label="인테리어 갤러리 검색 결과">
      {items.map((item) => (
        <article key={item.id} className="gallery-scrap-card" aria-label={item.title}>
          <div
            className="gallery-scrap-card-image"
            role="button"
            tabIndex={deleteMode ? -1 : 0}
            aria-label={`${item.title} 크게 보기`}
            onClick={() => {
              if (!deleteMode) onOpen(item);
            }}
            onKeyDown={(event) => {
              if (!deleteMode && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                onOpen(item);
              }
            }}
          >
            {/* 원본 이미지의 실제 비율을 그대로 사용해야 5/4/3/2열 모두 자연스러운 Masonry가 유지됩니다. */}
            <img
              src={item.src}
              alt={item.title}
              loading="lazy"
              decoding="async"
            />

            {deleteMode ? (
              <AdminDeleteButton label={`${item.title} 삭제`} onDelete={() => onDelete(item)} />
            ) : (
              <>
                <ScrapButton
                  className="gallery-card-heart"
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
                  className="gallery-card-share"
                  projectSlug={item.projectSlug}
                  projectTitle={item.projectTitle || item.title}
                  fallbackPath="/gallery"
                />
              </>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
