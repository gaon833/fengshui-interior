"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import projectsData from "@/content/projects.json";
import type { Project } from "@/types/project";
import ScrapButton from "@/components/project/ScrapButton";
import ShareIconButton from "@/components/project/ShareIconButton";
import ImageLightbox from "@/components/gallery/ImageLightbox";
import { deleteGalleryItem, GALLERY_EVENT, hideGalleryItem, readGalleryItems, readHiddenGalleryIds, type GalleryItem } from "@/lib/gallery-store";
import { trackGallerySearch, trackGalleryView } from "@/lib/gallery-analytics";
import { useAdminDeleteMode } from "@/lib/admin-delete-mode";
import { AdminDeleteButton, AdminDeleteChrome, confirmVisualDelete } from "@/components/admin-delete/AdminDeleteChrome";
import { galleryTagsToSearchText, type GalleryTags } from "@/lib/gallery-tags";

const projects = projectsData as Project[];

const seedItems: GalleryItem[] = projects
  .filter((project) => project.status === "published")
  .flatMap((project) => project.images.slice(0, 2).map((image, index) => ({
    id: `seed:${project.slug}:${image.id || index}`,
    src: image.src,
    title: image.alt || project.title,
    projectSlug: project.slug,
    projectTitle: project.title,
    searchText: [image.alt, project.title, project.location, project.area, project.useType, ...project.tags, project.seo?.description].filter(Boolean).join(" "),
    createdAt: project.updatedAt,
  })))
  .slice(0, 48);

const synonymGroups = [
  ["주방", "키친", "부엌", "kitchen"], ["거실", "리빙", "리빙룸", "living", "livingroom"],
  ["욕실", "화장실", "bathroom", "bath"], ["침실", "방", "bedroom"],
  ["화이트", "흰색", "아이보리", "크림", "오프화이트", "white", "ivory"],
  ["아이보리", "크림", "오프화이트", "화이트", "베이지", "ivory", "cream"],
  ["우드톤", "우드", "나무", "오크", "월넛", "wood", "oak", "walnut"],
  ["호텔식", "호텔", "럭셔리", "고급", "hotel", "luxury"],
  ["미니멀", "심플", "모던", "깔끔", "minimal", "modern"],
  ["웜 미니멀", "따뜻한 미니멀", "warm minimalism"],
  ["콰이어트 럭셔리", "조용한 럭셔리", "quiet luxury"],
  ["간접조명", "무드조명", "조명", "lighting", "light"], ["타일", "대리석", "마블", "tile", "marble"],
];

function normalize(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[^0-9a-zA-Z가-힣]+/g, " ").replace(/\s+/g, " ").trim();
}

function localTerms(query: string) {
  const base = normalize(query).split(" ").filter(Boolean);
  return base.map((term) => {
    const group = synonymGroups.find((items) => items.some((item) => normalize(item).includes(term) || term.includes(normalize(item))));
    return group ? group.map(normalize) : [term];
  });
}

function tagValues(tags?: GalleryTags) {
  if (!tags) return [];
  return [tags.space, ...tags.structures, ...tags.styles, ...tags.colors, ...tags.materials, ...tags.features].filter(Boolean);
}

function itemMatchesFilters(item: GalleryItem, filters: ActiveFilters) {
  const tags = item.tags;
  if (!tags) return Object.values(filters).every((values) => values.length === 0);
  return filters.spaces.every((value) => tags.space === value)
    && filters.styles.every((value) => tags.styles.includes(value))
    && filters.colors.every((value) => tags.colors.includes(value));
}

function localScore(item: GalleryItem, query: string) {
  if (!query.trim()) return 1;
  const tags = item.tags;
  const tagText = tags ? galleryTagsToSearchText(tags) : "";
  const haystack = normalize([item.title, item.projectTitle, item.projectSlug, item.searchText, tagText].filter(Boolean).join(" "));
  let score = 0;
  for (const alternatives of localTerms(query)) {
    const exactTagMatches = tagValues(tags).filter((tag) => alternatives.some((term) => normalize(tag) === term)).length;
    const textMatches = alternatives.filter((term) => haystack.includes(term)).length;
    if (!exactTagMatches && !textMatches) return 0;
    score += exactTagMatches * 40 + textMatches * 8;
  }
  if (haystack.includes(normalize(query))) score += 30;
  if (tags?.space && localTerms(query).flat().includes(normalize(tags.space))) score += 60;
  return score;
}

export default function GalleryBoard() {
  const deleteMode = useAdminDeleteMode();
  const [customItems, setCustomItems] = useState<GalleryItem[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const sync = () => { setCustomItems(readGalleryItems()); setHiddenIds(readHiddenGalleryIds()); };
    sync(); window.addEventListener("storage", sync); window.addEventListener(GALLERY_EVENT, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(GALLERY_EVENT, sync); };
  }, []);

  const items = useMemo(() => [...customItems, ...seedItems].filter((item) => !hiddenIds.includes(item.id)), [customItems, hiddenIds]);

  const removeGalleryItem = async (item: GalleryItem) => {
    if (!confirmVisualDelete("이 GALLERY 이미지를 삭제하시겠습니까?")) return;
    if (item.id.startsWith("seed:")) hideGalleryItem(item.id); else deleteGalleryItem(item.id);
    setSelected(null);
    await fetch("/api/admin/content-delete", { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ kind: "gallery", id: item.id }) }).catch(() => undefined);
  };

  const filteredItems = useMemo(() => items
    .map((item) => ({ item, score: localScore(item, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item), [items, query]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    trackGallerySearch(query);
  };

  return (
    <div className={deleteMode.active ? "admin-delete-page-shell is-gallery-delete" : undefined}>
      {deleteMode.active && <AdminDeleteChrome label="GALLERY 이미지 삭제" />}
      {!deleteMode.active && <div className="gallery-discovery-wrap">
        <form className="gallery-search-wrap" onSubmit={submitSearch}>
          <label className="gallery-search" aria-label="갤러리 검색">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="화이트 거실, 간접조명 욕실처럼 검색해보세요" autoComplete="off" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기">×</button>}
          </label>
        </form>
        {query.trim() && <div className="gallery-search-meta" role="status">{filteredItems.length}개의 관련 이미지</div>}
      </div>}

      {filteredItems.length > 0 ? (
        <section className="gallery-masonry" aria-label="인테리어 갤러리 검색 결과">
          {filteredItems.map((item) => (
            <article className="gallery-card" key={item.id}><div className="gallery-card-image" role="button" tabIndex={0} aria-label={`${item.title} 크게 보기`}
              onClick={() => { if (!deleteMode.active) { trackGalleryView(item.id); setSelected(item); } }}
              onKeyDown={(event) => { if (!deleteMode.active && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); trackGalleryView(item.id); setSelected(item); } }}>
              <Image src={item.src} alt={item.title} width={1200} height={1600} sizes="(max-width:700px) 50vw, (max-width:1200px) 33vw, 25vw" loading="lazy" decoding="async" unoptimized={item.src.startsWith("data:")} />
              {deleteMode.active ? <AdminDeleteButton label={`${item.title} 삭제`} onDelete={() => void removeGalleryItem(item)} /> : <>
                <ScrapButton className="gallery-card-heart" item={{ id: `gallery:${item.id}`, kind: "image", projectSlug: item.projectSlug || "gallery", projectTitle: item.projectTitle || item.title, src: item.src, alt: item.title }} />
                <ShareIconButton className="gallery-card-share" projectSlug={item.projectSlug} projectTitle={item.projectTitle || item.title} fallbackPath="/gallery" />
              </>}
            </div></article>
          ))}
        </section>
      ) : (
        <div className="gallery-empty-search" role="status"><p>관련 이미지를 찾지 못했습니다.</p><span>다른 태그나 표현으로 검색해 보세요.</span></div>
      )}

      {!deleteMode.active && <ImageLightbox item={selected ? { id: `gallery:${selected.id}`, src: selected.src, alt: selected.title, projectSlug: selected.projectSlug, projectTitle: selected.projectTitle || selected.title } : null} onClose={() => setSelected(null)} />}
    </div>
  );
}
