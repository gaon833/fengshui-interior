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

  return (
    <>
      <header className="scrap-intro">
        <div>
          <h1>SCRAP</h1>
          <p>하트를 누른 이미지가 여기에 저장됩니다.</p>
          <p className="scrap-device-note">현재 스크랩은 사용 중인 기기에만 저장되며, 다른 기기에서는 공유되지 않습니다.</p>
        </div>
        <span className="scrap-count" aria-label={`스크랩 ${items.length}개`}>{items.length}개</span>
      </header>

      {!items.length ? (
        <section className="scrap-empty-state" aria-live="polite">
          <span className="scrap-empty-heart" aria-hidden="true">♡</span>
          <h2>아직 스크랩한 이미지가 없습니다.</h2>
          <p>관심 있는 이미지를 하트(♡)로 저장하면 이곳에서 다시 확인할 수 있습니다.</p>
          <small>※ 현재 스크랩은 사용 중인 기기에만 저장됩니다.</small>
          <Link className="scrap-gallery-link" href="/gallery/">갤러리 보러가기</Link>
        </section>
      ) : (
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
      )}

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
