"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import projectsData from "@/content/projects.json";
import type { Project } from "@/types/project";
import { addGalleryItem, deleteGalleryItem, GALLERY_EVENT, readGalleryItems, type GalleryAnalysis, type GalleryItem } from "@/lib/gallery-store";
import { optimizeImageFile } from "@/lib/image-optimizer";
import { showAdminToast } from "@/lib/admin-toast";

const projects = (projectsData as Project[]).filter((project) => project.status === "published");

function list(value?: string[]) { return Array.isArray(value) ? value.filter(Boolean) : []; }
function normalizeAnalysis(value: Partial<GalleryAnalysis>): GalleryAnalysis {
  return {
    caption: String(value.caption || "인테리어 공간 이미지"),
    space: list(value.space), styles: list(value.styles), colors: list(value.colors),
    materials: list(value.materials), features: list(value.features), keywords: list(value.keywords),
    model: value.model, analyzedAt: new Date().toISOString(),
  };
}

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [src, setSrc] = useState("");
  const [fileName, setFileName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [analysis, setAnalysis] = useState<GalleryAnalysis | null>(null);
  const [pendingId, setPendingId] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState<"checking" | "ready" | "error">("checking");
  const sync = () => setItems(readGalleryItems());

  useEffect(() => {
    sync();
    window.addEventListener(GALLERY_EVENT, sync);
    void fetch("/api/gallery/analyze", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { ok?: boolean; aiBound?: boolean; dbBound?: boolean };
        setAiStatus(response.ok && payload.ok && payload.aiBound && payload.dbBound ? "ready" : "error");
      })
      .catch(() => setAiStatus("error"));
    return () => window.removeEventListener(GALLERY_EVENT, sync);
  }, []);
  const linkedProject = useMemo(() => projects.find((project) => project.slug === projectSlug), [projectSlug]);

  const analyze = async (image: string, galleryId = pendingId || crypto.randomUUID()) => {
    setAnalyzing(true); setAnalysis(null);
    try {
      const response = await fetch("/api/gallery/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image, galleryId }) });
      const payload = await response.json() as { ok?: boolean; analysis?: Partial<GalleryAnalysis>; model?: string; error?: string; storedInD1?: boolean };
      if (!response.ok || !payload.ok || !payload.analysis || !payload.storedInD1) throw new Error(payload.error || "AI 분석 결과를 D1에 저장하지 못했습니다.");
      const next = normalizeAnalysis({ ...payload.analysis, model: payload.model });
      setPendingId(galleryId); setAnalysis(next); showAdminToast("AI가 사진을 분석했습니다.");
    } catch (error) {
      showAdminToast(error instanceof Error ? error.message : "AI 분석에 실패했습니다.", "error");
    } finally { setAnalyzing(false); }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const optimized = await optimizeImageFile(file, { maxWidth: 1600, maxHeight: 2400, quality: .84 });
      if (items.some((item) => item.src === optimized)) { setSrc(""); setFileName(""); return showAdminToast("이미 등록된 동일한 이미지입니다.", "error"); }
      const nextId = crypto.randomUUID(); setPendingId(nextId); setSrc(optimized); setFileName(file.name.replace(/\.[^.]+$/, ""));
      showAdminToast("이미지가 최적화되었습니다.");
      await analyze(optimized, nextId);
    } catch (error) { showAdminToast(error instanceof Error ? error.message : "이미지를 처리하지 못했습니다.", "error"); }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!src) return showAdminToast("이미지를 선택해 주세요.", "error");
    if (!analysis) return showAdminToast("AI 분석이 완료된 뒤 저장할 수 있습니다. AI 다시 분석을 눌러 주세요.", "error");
    const title = analysis?.caption || (linkedProject ? `${linkedProject.title} 갤러리 이미지` : (fileName || "인테리어 갤러리 이미지"));
    const aiTerms = analysis ? [analysis.caption, ...analysis.space, ...analysis.styles, ...analysis.colors, ...analysis.materials, ...analysis.features, ...analysis.keywords] : [];
    const searchText = [fileName, ...aiTerms, linkedProject?.title, linkedProject?.location, linkedProject?.area, linkedProject?.useType, ...(linkedProject?.tags || []), linkedProject?.seo?.description].filter(Boolean).join(" ");
    addGalleryItem({ id: pendingId || crypto.randomUUID(), src, title, projectSlug: linkedProject?.slug, projectTitle: linkedProject?.title, searchText, analysis: analysis || undefined });
    setSrc(""); setFileName(""); setProjectSlug(""); setAnalysis(null); setPendingId(""); showAdminToast("GALLERY 이미지가 저장되었습니다.");
  };

  return <div className="admin-stack">
    <form className="admin-card admin-form" onSubmit={onSubmit}>
      <div className="admin-heading"><div><h1>GALLERY 관리</h1></div><a className="admin-filter-button" href="/gallery/?adminDelete=1&returnTo=%2Fadmin%2Fgallery">이미지 삭제</a></div>
      <p>사진을 선택하면 Workers AI가 자동 분석하고 결과를 D1에 저장합니다. 1차 단계에서는 분석 완료가 확인된 사진만 등록됩니다.</p>
      <div className={`admin-ai-connection ${aiStatus}`} role="status">{aiStatus === "checking" ? "AI · D1 연결 확인 중…" : aiStatus === "ready" ? "Workers AI · D1 연결 정상" : "Workers AI 또는 D1 연결을 확인해 주세요"}</div>
      <label>이미지 <small>권장 업로드: 가로 3200px 이상 · 원본 비율 유지</small><input type="file" accept="image/*" onChange={(event) => void onFile(event.target.files?.[0])}/></label>
      {src && <div className="admin-gallery-preview"><Image src={src} alt="미리보기" width={700} height={900} unoptimized /></div>}
      {analyzing && <div className="admin-ai-status" role="status">AI가 사진을 분석하고 있습니다…</div>}
      {analysis && <section className="admin-ai-result"><strong>AI 분석 완료</strong><p>{analysis.caption}</p><div>{[...analysis.space, ...analysis.styles, ...analysis.colors, ...analysis.materials, ...analysis.features].map((tag) => <span key={tag}>{tag}</span>)}</div></section>}
      {src && !analyzing && <button type="button" className="admin-secondary-button" onClick={() => void analyze(src)}>AI 다시 분석</button>}
      <label>연결 프로젝트 <small>선택사항</small><select value={projectSlug} onChange={(event) => setProjectSlug(event.target.value)}><option value="">연결하지 않음</option>{projects.map((project) => <option key={project.slug} value={project.slug}>{project.title} · {project.area}</option>)}</select></label>
      <button type="submit" className="admin-primary-button" disabled={analyzing || !analysis || aiStatus !== "ready"}>저장</button>
    </form>
    <section className="admin-card"><h2>등록된 GALLERY</h2>{items.length === 0 ? <p>추가한 이미지가 없습니다.</p> : <div className="admin-gallery-list">{items.map((item) => <article key={item.id}><Image src={item.src} alt={item.title} width={220} height={280} unoptimized/><div><strong>{item.projectTitle || "독립 GALLERY 이미지"}</strong>{item.analysis && <small>AI 분석됨 · {item.analysis.space.slice(0,2).join(" · ") || item.analysis.styles.slice(0,2).join(" · ")}</small>}<a href="/gallery/?adminDelete=1&returnTo=%2Fadmin%2Fgallery">이미지 삭제</a></div></article>)}</div>}</section>
  </div>;
}
