"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import projectsData from "@/content/projects.json";
import type { Project } from "@/types/project";
import ScrapButton from "@/components/project/ScrapButton";
import ShareIconButton from "@/components/project/ShareIconButton";
import ImageLightbox from "@/components/gallery/ImageLightbox";
import { GALLERY_EVENT, readGalleryItems, type GalleryItem } from "@/lib/gallery-store";
import { trackGallerySearch, trackGalleryView } from "@/lib/gallery-analytics";

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
  ["우드", "나무", "오크", "월넛", "wood", "oak", "walnut"],
  ["호텔", "호텔식", "럭셔리", "고급", "hotel", "luxury"],
  ["미니멀", "심플", "모던", "깔끔", "minimal", "modern"],
  ["베이지", "크림", "아이보리", "beige", "웜", "warm"],
  ["조명", "간접조명", "무드조명", "lighting", "light"], ["타일", "대리석", "마블", "tile", "marble"],
];

function normalize(value: string) { return value.toLocaleLowerCase("ko-KR").replace(/[^0-9a-zA-Z가-힣]+/g, " ").replace(/\s+/g, " ").trim(); }
function localTerms(query: string) {
  const base = normalize(query).split(" ").filter(Boolean);
  return base.map((term) => {
    const group = synonymGroups.find((items) => items.some((item) => normalize(item).includes(term) || term.includes(normalize(item))));
    return group ? group.map(normalize) : [term];
  });
}
function localScore(item: GalleryItem, query: string) {
  if (!query.trim()) return 1;
  const analysis = item.analysis;
  const haystack = normalize([
    item.title, item.projectTitle, item.projectSlug, item.searchText, analysis?.caption,
    ...(analysis?.space || []), ...(analysis?.styles || []), ...(analysis?.colors || []),
    ...(analysis?.materials || []), ...(analysis?.features || []), ...(analysis?.keywords || []),
  ].filter(Boolean).join(" "));
  let score = 0;
  for (const alternatives of localTerms(query)) {
    const matches = alternatives.filter((term) => haystack.includes(term)).length;
    if (!matches) return 0;
    score += matches * 8;
  }
  if (haystack.includes(normalize(query))) score += 30;
  return score;
}

type SearchResult = { galleryId: string; score: number; matchedTerms?: string[] };

export default function GalleryBoard() {
  const [customItems, setCustomItems] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [usedAI, setUsedAI] = useState(false);

  useEffect(() => {
    const sync = () => setCustomItems(readGalleryItems());
    sync(); window.addEventListener("storage", sync); window.addEventListener(GALLERY_EVENT, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(GALLERY_EVENT, sync); };
  }, []);

  const items = useMemo(() => [...customItems, ...seedItems], [customItems]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) { setRemoteResults(null); setSearching(false); setUsedAI(false); return; }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      trackGallerySearch(normalizedQuery);
      try {
        const response = await fetch("/api/gallery/search", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: normalizedQuery, galleryIds: customItems.map((item) => item.id) }),
        });
        const payload = await response.json() as { ok?: boolean; results?: SearchResult[]; usedAI?: boolean };
        if (!response.ok || !payload.ok) throw new Error("검색 실패");
        setRemoteResults(payload.results || []); setUsedAI(Boolean(payload.usedAI));
      } catch {
        setRemoteResults([]); setUsedAI(false);
      } finally { setSearching(false); }
    }, 550);
    return () => window.clearTimeout(timer);
  }, [query, customItems]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const remoteMap = new Map((remoteResults || []).map((result) => [result.galleryId, result.score]));
    return items
      .map((item) => {
        const remote = remoteMap.get(item.id) || 0;
        const local = localScore(item, query);
        return { item, score: Math.max(remote, local) + (remote > 0 ? 1000 : 0) };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [items, query, remoteResults]);

  return (
    <>
      <div className="gallery-search-wrap">
        <label className="gallery-search" aria-label="AI 갤러리 검색">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="거실, 아이보리, 호텔 느낌처럼 검색해보세요" autoComplete="off" />
          {searching && <span className="gallery-searching" aria-label="AI 검색 중">AI</span>}
          {!searching && query && <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기">×</button>}
        </label>
        {query.trim() && <div className="gallery-search-meta" role="status">{searching ? "AI가 사진 분석 결과를 검색하고 있습니다…" : `${filteredItems.length}개의 관련 이미지${usedAI ? " · AI 의미 검색" : ""}`}</div>}
      </div>

      {filteredItems.length > 0 ? (
        <section className="gallery-masonry" aria-label="인테리어 갤러리 검색 결과">
          {filteredItems.map((item) => (
            <article className="gallery-card" key={item.id}><div className="gallery-card-image" role="button" tabIndex={0} aria-label={`${item.title} 크게 보기`}
              onClick={() => { trackGalleryView(item.id); setSelected(item); }}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); trackGalleryView(item.id); setSelected(item); } }}>
              <Image src={item.src} alt={item.title} width={1200} height={1600} sizes="(max-width:700px) 50vw, (max-width:1200px) 33vw, 25vw" loading="lazy" decoding="async" unoptimized={item.src.startsWith("data:")} />
              <ScrapButton className="gallery-card-heart" item={{ id: `gallery:${item.id}`, kind: "image", projectSlug: item.projectSlug || "gallery", projectTitle: item.projectTitle || item.title, src: item.src, alt: item.title }} />
              <ShareIconButton className="gallery-card-share" projectSlug={item.projectSlug} projectTitle={item.projectTitle || item.title} fallbackPath="/gallery" />
            </div></article>
          ))}
        </section>
      ) : !searching ? (
        <div className="gallery-empty-search" role="status"><p>관련 이미지를 찾지 못했습니다.</p><span>다른 표현으로 검색해 보세요.</span></div>
      ) : null}

      <ImageLightbox item={selected ? { id: `gallery:${selected.id}`, src: selected.src, alt: selected.title, projectSlug: selected.projectSlug, projectTitle: selected.projectTitle || selected.title } : null} onClose={() => setSelected(null)} />
    </>
  );
}
