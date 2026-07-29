"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import projectsData from "@/content/projects.json";
import type { Project } from "@/types/project";
import ScrapButton from "@/components/project/ScrapButton";
import ShareIconButton from "@/components/project/ShareIconButton";
import ImageLightbox from "@/components/gallery/ImageLightbox";
import { GALLERY_EVENT, readGalleryItems, type GalleryItem } from "@/lib/gallery-store";

const projects = projectsData as Project[];

const seedItems: GalleryItem[] = projects
  .filter((project) => project.status === "published")
  .flatMap((project) => project.images.slice(0, 2).map((image, index) => ({
    id: `seed:${project.slug}:${image.id || index}`,
    src: image.src,
    title: image.alt || project.title,
    projectSlug: project.slug,
    projectTitle: project.title,
    searchText: [
      image.alt,
      project.title,
      project.location,
      project.area,
      project.useType,
      ...project.tags,
      project.seo?.description,
    ].filter(Boolean).join(" "),
    createdAt: project.updatedAt,
  })))
  .slice(0, 48);

const synonymGroups = [
  ["주방", "키친", "kitchen"],
  ["거실", "리빙", "living", "livingroom"],
  ["욕실", "화장실", "bathroom", "bath"],
  ["침실", "방", "bedroom"],
  ["현관", "entrance", "entry"],
  ["화이트", "흰색", "white", "밝은"],
  ["우드", "나무", "wood", "오크", "oak"],
  ["호텔", "hotel", "럭셔리", "고급"],
  ["미니멀", "minimal", "심플", "모던", "modern"],
  ["베이지", "beige", "웜", "warm"],
  ["조명", "lighting", "간접조명", "light"],
  ["타일", "tile", "대리석", "marble"],
];

function normalize(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[\s_-]+/g, " ").trim();
}

function expandTerms(query: string) {
  const terms = normalize(query).split(" ").filter(Boolean);
  return terms.map((term) => {
    const group = synonymGroups.find((items) => items.some((item) => normalize(item).includes(term) || term.includes(normalize(item))));
    return group ? group.map(normalize) : [term];
  });
}

function matches(item: GalleryItem, query: string) {
  if (!query.trim()) return true;
  const haystack = normalize([item.title, item.projectTitle, item.projectSlug, item.searchText].filter(Boolean).join(" "));
  return expandTerms(query).every((alternatives) => alternatives.some((term) => haystack.includes(term)));
}

export default function GalleryBoard() {
  const [customItems, setCustomItems] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [query, setQuery] = useState("");

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
  const filteredItems = useMemo(() => items.filter((item) => matches(item, query)), [items, query]);

  return (
    <>
      <div className="gallery-search-wrap">
        <label className="gallery-search" aria-label="갤러리 검색">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="원하는 공간이나 분위기를 검색해보세요"
            autoComplete="off"
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기">×</button>}
        </label>
      </div>

      {filteredItems.length > 0 ? (
        <section className="gallery-masonry" aria-label="인테리어 갤러리 검색 결과">
          {filteredItems.map((item) => (
            <article className="gallery-card" key={item.id}>
              <div
                className="gallery-card-image"
                role="button"
                tabIndex={0}
                aria-label={`${item.title} 크게 보기`}
                onClick={() => setSelected(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(item);
                  }
                }}
              >
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
            </article>
          ))}
        </section>
      ) : (
        <div className="gallery-empty-search" role="status">
          <p>관련 이미지를 찾지 못했습니다.</p>
          <span>다른 표현으로 검색해 보세요.</span>
        </div>
      )}

      <ImageLightbox
        item={selected ? {
          id: `gallery:${selected.id}`,
          src: selected.src,
          alt: selected.title,
          projectSlug: selected.projectSlug,
          projectTitle: selected.projectTitle || selected.title,
        } : null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
