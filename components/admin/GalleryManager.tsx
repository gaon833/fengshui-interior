"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import projectsData from "@/content/projects.json";
import type { Project } from "@/types/project";
import { addGalleryItem, GALLERY_EVENT, readGalleryItems, type GalleryAnalysis, type GalleryItem } from "@/lib/gallery-store";
import { optimizeImageFile } from "@/lib/image-optimizer";
import { showAdminToast } from "@/lib/admin-toast";

const projects = (projectsData as Project[]).filter((project) => project.status === "published");
const MAX_BATCH = 10;
const ANALYSIS_CONCURRENCY = 2;

type UploadStatus = "queued" | "optimizing" | "analyzing" | "ready" | "warning" | "failed" | "saved";
type UploadTask = {
  id: string;
  fileName: string;
  src: string;
  status: UploadStatus;
  analysis: GalleryAnalysis | null;
  error?: string;
};

function list(value?: string[]) { return Array.isArray(value) ? value.filter(Boolean) : []; }
function normalizeAnalysis(value: Partial<GalleryAnalysis>): GalleryAnalysis {
  return {
    caption: String(value.caption || "인테리어 공간 이미지"),
    space: list(value.space), styles: list(value.styles), colors: list(value.colors),
    materials: list(value.materials), features: list(value.features), keywords: list(value.keywords),
    model: value.model, analyzedAt: new Date().toISOString(),
  };
}
function fallbackAnalysis(fileName: string): GalleryAnalysis {
  const clean = fileName.replace(/[_-]+/g, " ").trim();
  return normalizeAnalysis({
    caption: clean ? `${clean} 인테리어 이미지` : "인테리어 공간 이미지",
    keywords: clean ? clean.split(/\s+/).filter(Boolean).slice(0, 8) : ["인테리어"],
  });
}
function statusText(status: UploadStatus) {
  return ({ queued: "대기", optimizing: "이미지 최적화 중", analyzing: "AI 분석 중", ready: "분석 완료", warning: "사진 저장 가능 · AI 재분석 권장", failed: "처리 실패", saved: "저장 완료" } as const)[status];
}

async function runPool<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>) {
  let cursor = 0;
  async function runner() {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runner()));
}

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [projectSlug, setProjectSlug] = useState("");
  const [processing, setProcessing] = useState(false);
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
  const saveableCount = tasks.filter((task) => task.status === "ready" || task.status === "warning").length;

  const patchTask = (id: string, patch: Partial<UploadTask>) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  };

  const analyzeTask = async (task: UploadTask) => {
    patchTask(task.id, { status: "analyzing", error: undefined });
    try {
      const response = await fetch("/api/gallery/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: task.src, galleryId: task.id }),
      });
      const payload = await response.json() as {
        ok?: boolean; analysis?: Partial<GalleryAnalysis>; model?: string; error?: string;
        storedInD1?: boolean; warning?: string; recovered?: boolean;
      };
      if (!response.ok || !payload.ok || !payload.analysis || !payload.storedInD1) {
        throw new Error(payload.error || "AI 분석을 완료하지 못했습니다.");
      }
      patchTask(task.id, {
        analysis: normalizeAnalysis({ ...payload.analysis, model: payload.model }),
        status: payload.warning || payload.recovered ? "warning" : "ready",
        error: payload.warning,
      });
    } catch (error) {
      // AI가 일시적으로 실패해도 사진 업로드 자체는 막지 않는다.
      patchTask(task.id, {
        analysis: fallbackAnalysis(task.fileName),
        status: "warning",
        error: error instanceof Error ? error.message : "AI 분석이 지연되었습니다.",
      });
    }
  };

  const onFiles = async (files?: FileList | null) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    if (selected.length > MAX_BATCH) {
      showAdminToast(`한 번에 최대 ${MAX_BATCH}장까지 업로드할 수 있습니다.`, "error");
      return;
    }

    const nextTasks: UploadTask[] = selected.map((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name.replace(/\.[^.]+$/, ""),
      src: "",
      status: "queued",
      analysis: null,
    }));
    setTasks(nextTasks);
    setProcessing(true);

    try {
      await runPool(selected.map((file, index) => ({ file, task: nextTasks[index] })), ANALYSIS_CONCURRENCY, async ({ file, task }) => {
        patchTask(task.id, { status: "optimizing" });
        try {
          const optimized = await optimizeImageFile(file, { maxWidth: 1600, maxHeight: 2400, quality: .84 });
          if (items.some((item) => item.src === optimized)) {
            patchTask(task.id, { status: "failed", error: "이미 등록된 동일한 이미지입니다." });
            return;
          }
          const readyTask = { ...task, src: optimized, status: "analyzing" as const };
          patchTask(task.id, { src: optimized, status: "analyzing" });
          await analyzeTask(readyTask);
        } catch (error) {
          patchTask(task.id, { status: "failed", error: error instanceof Error ? error.message : "이미지를 처리하지 못했습니다." });
        }
      });
      showAdminToast(`${selected.length}장의 처리가 끝났습니다.`);
    } finally {
      setProcessing(false);
    }
  };

  const retryTask = async (task: UploadTask) => {
    if (!task.src) return;
    setProcessing(true);
    try { await analyzeTask(task); }
    finally { setProcessing(false); }
  };

  const saveAll = () => {
    const targets = tasks.filter((task) => (task.status === "ready" || task.status === "warning") && task.src && task.analysis);
    if (!targets.length) return showAdminToast("저장할 사진이 없습니다.", "error");

    for (const task of targets) {
      const analysis = task.analysis!;
      const title = analysis.caption || (linkedProject ? `${linkedProject.title} 갤러리 이미지` : `${task.fileName || "인테리어"} 갤러리 이미지`);
      const aiTerms = [analysis.caption, ...analysis.space, ...analysis.styles, ...analysis.colors, ...analysis.materials, ...analysis.features, ...analysis.keywords];
      const searchText = [task.fileName, ...aiTerms, linkedProject?.title, linkedProject?.location, linkedProject?.area, linkedProject?.useType, ...(linkedProject?.tags || []), linkedProject?.seo?.description].filter(Boolean).join(" ");
      addGalleryItem({ id: task.id, src: task.src, title, projectSlug: linkedProject?.slug, projectTitle: linkedProject?.title, searchText, analysis });
    }
    setTasks([]);
    setProjectSlug("");
    showAdminToast(`${targets.length}장의 GALLERY 이미지가 저장되었습니다.`);
  };

  return <div className="admin-stack">
    <section className="admin-card admin-form">
      <div className="admin-heading"><div><h1>GALLERY 관리</h1></div><a className="admin-filter-button" href="/gallery/?adminDelete=1&returnTo=%2Fadmin%2Fgallery">이미지 삭제</a></div>
      <p>한 번에 최대 10장을 선택할 수 있습니다. 사진은 2장씩 안정적으로 최적화하고 AI 분석합니다.</p>
      <div className={`admin-ai-connection ${aiStatus}`} role="status">{aiStatus === "checking" ? "AI · D1 연결 확인 중…" : aiStatus === "ready" ? "Workers AI · D1 연결 정상" : "Workers AI 또는 D1 연결을 확인해 주세요"}</div>
      <label>이미지 <small>최대 10장 · 각 원본 30MB 이하 · 원본 비율 유지</small><input type="file" accept="image/*" multiple disabled={processing} onChange={(event) => void onFiles(event.target.files)}/></label>

      {tasks.length > 0 && <div className="admin-gallery-batch" aria-live="polite">
        {tasks.map((task) => <article className={`admin-gallery-batch-item is-${task.status}`} key={task.id}>
          <div className="admin-gallery-batch-image">{task.src ? <Image src={task.src} alt={task.fileName} width={300} height={360} unoptimized/> : <span>{task.status === "optimizing" ? "최적화 중" : "대기"}</span>}</div>
          <div className="admin-gallery-batch-meta">
            <strong>{task.fileName}</strong>
            <span>{statusText(task.status)}</span>
            {task.analysis && <small>{task.analysis.caption}</small>}
            {task.error && <small className="admin-gallery-batch-warning">{task.error}</small>}
            {task.src && (task.status === "warning" || task.status === "failed") && <button type="button" className="admin-secondary-button" disabled={processing} onClick={() => void retryTask(task)}>AI 다시 분석</button>}
          </div>
        </article>)}
      </div>}

      <label>연결 프로젝트 <small>선택한 모든 사진에 공통 적용 · 선택사항</small><select value={projectSlug} onChange={(event) => setProjectSlug(event.target.value)}><option value="">연결하지 않음</option>{projects.map((project) => <option key={project.slug} value={project.slug}>{project.title} · {project.area}</option>)}</select></label>
      <button type="button" className="admin-primary-button" disabled={processing || saveableCount === 0} onClick={saveAll}>{processing ? "처리 중…" : `${saveableCount}장 저장`}</button>
      <small className="admin-gallery-batch-note">AI 분석이 일시적으로 실패한 사진도 저장할 수 있으며, 이후 ‘AI 다시 분석’으로 보완할 수 있습니다.</small>
    </section>

    <section className="admin-card"><h2>등록된 GALLERY</h2>{items.length === 0 ? <p>추가한 이미지가 없습니다.</p> : <div className="admin-gallery-list">{items.map((item) => <article key={item.id}><Image src={item.src} alt={item.title} width={220} height={280} unoptimized/><div><strong>{item.projectTitle || "독립 GALLERY 이미지"}</strong>{item.analysis && <small>AI 분석됨 · {item.analysis.space.slice(0,2).join(" · ") || item.analysis.styles.slice(0,2).join(" · ")}</small>}<a href="/gallery/?adminDelete=1&returnTo=%2Fadmin%2Fgallery">이미지 삭제</a></div></article>)}</div>}</section>
  </div>;
}
