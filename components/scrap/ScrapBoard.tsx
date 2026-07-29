"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ENGAGEMENT_EVENT, readScraps, type ScrapItem } from "@/lib/engagement";
import ScrapButton from "@/components/project/ScrapButton";
import ShareIconButton from "@/components/project/ShareIconButton";
import ImageLightbox from "@/components/gallery/ImageLightbox";

export default function ScrapBoard() {
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [selected, setSelected] = useState<ScrapItem | null>(null);

  useEffect(() => {
    const sync = () => setItems(readScraps());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ENGAGEMENT_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ENGAGEMENT_EVENT, sync);
    };
  }, []);

  if (!items.length) return <p className="scrap-empty">아직 스크랩한 이미지가 없습니다.</p>;

  return (
    <>
      <section className="scrap-masonry" aria-live="polite">
        {items.map((item) => {
          const image = (
            <div className="scrap-card-image">
              <Image
                src={item.src}
                alt={item.alt}
                width={item.kind === "project" ? 1600 : 1200}
                height={item.kind === "project" ? 1050 : 1600}
                unoptimized={item.src.startsWith("data:")}
                sizes="(max-width:700px) 50vw, (max-width:1200px) 33vw, 25vw"
              />
              <ScrapButton
                className="scrap-board-heart"
                item={{ id: item.id, kind: item.kind, projectSlug: item.projectSlug, projectTitle: item.projectTitle, src: item.src, alt: item.alt }}
              />
              <ShareIconButton
                className="scrap-card-share"
                projectSlug={item.projectSlug === "gallery" ? undefined : item.projectSlug}
                projectTitle={item.projectTitle}
                fallbackPath="/gallery"
              />
            </div>
          );

          return (
            <article className={`scrap-card scrap-card--${item.kind}`} key={item.id}>
              {item.kind === "project" ? (
                <Link href={`/project/view/?slug=${encodeURIComponent(item.projectSlug)}`} aria-label={`${item.projectTitle} 프로젝트 상세 보기`}>
                  {image}
                </Link>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.alt} 크게 보기`}
                  onClick={() => setSelected(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(item);
                    }
                  }}
                >
                  {image}
                </div>
              )}
            </article>
          );
        })}
      </section>
      <ImageLightbox
        item={selected ? {
          id: selected.id,
          src: selected.src,
          alt: selected.alt,
          projectSlug: selected.projectSlug === "gallery" ? undefined : selected.projectSlug,
          projectTitle: selected.projectTitle,
        } : null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
