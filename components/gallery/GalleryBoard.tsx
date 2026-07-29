"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import projectsData from "@/content/projects.json";
import type { Project } from "@/types/project";
import ScrapButton from "@/components/project/ScrapButton";
import ShareIconButton from "@/components/project/ShareIconButton";
import { GALLERY_EVENT, readGalleryItems, type GalleryItem } from "@/lib/gallery-store";

const seedItems: GalleryItem[] = (projectsData as Project[])
  .filter((project) => project.status === "published")
  .flatMap((project) => project.images.slice(0, 2).map((image, index) => ({
    id: `seed:${project.slug}:${image.id || index}`,
    src: image.src,
    title: image.alt || project.title,
    space: project.tags[0] || "INTERIOR",
    projectSlug: project.slug,
    projectTitle: project.title,
    createdAt: project.updatedAt,
  })))
  .slice(0, 48);

export default function GalleryBoard() {
  const [customItems, setCustomItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const sync = () => setCustomItems(readGalleryItems());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(GALLERY_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(GALLERY_EVENT, sync);
    };
  }, []);

  const items = useMemo(() => [...customItems, ...seedItems], [customItems]);

  return (
    <section className="gallery-masonry" aria-label="인테리어 갤러리">
      {items.map((item) => {
        const content = (
          <>
            <div className="gallery-card-image">
              <Image
                src={item.src}
                alt={item.title}
                width={1200}
                height={1600}
                sizes="(max-width:700px) 50vw, (max-width:1200px) 33vw, 25vw"
                loading="lazy"
                decoding="async"
                unoptimized={item.src.startsWith("data:")}
              />
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
            </div>
            <div className="gallery-card-meta">
              <span>{item.space}</span>
              <strong>{item.title}</strong>
            </div>
          </>
        );

        return (
          <article className="gallery-card" key={item.id}>
            {item.projectSlug ? <Link href={`/project/${item.projectSlug}`}>{content}</Link> : content}
          </article>
        );
      })}
    </section>
  );
}
