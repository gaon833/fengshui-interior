"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { addGalleryItems, GALLERY_EVENT, readGalleryItems, type GalleryItem } from "@/lib/gallery-store";
import { optimizeImageFile } from "@/lib/image-optimizer";
import { showAdminToast } from "@/lib/admin-toast";
import { EMPTY_GALLERY_TAGS, GALLERY_TAG_OPTIONS, galleryTagsToSearchText, type GalleryTags } from "@/lib/gallery-tags";

const MAX_BATCH = 10;
const OPTIMIZE_CONCURRENCY = 2;

type UploadStatus = "queued" | "optimizing" | "ready" | "failed";
type UploadTask = {
  id: string;
  fileName: string;
  src: string;
  status: UploadStatus;
  tags: GalleryTags;
  error?: string;
};

type MultiTagKey = Exclude<keyof GalleryTags, "space">;

const cloneTags = (tags: GalleryTags): GalleryTags => ({
  space: tags.space,
  structures: [...tags.structures],
  styles: [...tags.styles],
  colors: [...tags.colors],
  materials: [...tags.materials],
  features: [...tags.features],
});

function statusText(status: UploadStatus) {
  return ({ queued: "대기", optimizing: "이미지 최적화 중", ready: "태그 확인 필요", failed: "처리 실패" } as const)[status];
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

function TagGroup({ title, options, selected, single = false, onToggle }: {
  title: string;
  options: readonly string[];
  selected: string[];
  single?: boolean;
  onToggle: (value: string) => void;
}) {
  return <fieldset className="gallery-tag-group">
    <legend>{title}{single && <small>필수 1개</small>}</legend>
    <div className="gallery-tag-buttons">
      {options.map((option) => <button key={option} type="button" className={selected.includes(option) ? "is-selected" : ""} aria-pressed={selected.includes(option)} onClick={() => onToggle(option)}>{option}</button>)}
    </div>
  </fieldset>;
}

function TagEditor({ tags, onChange, compact = false }: { tags: GalleryTags; onChange: (tags: GalleryTags) => void; compact?: boolean }) {
  const toggleSpace = (value: string) => onChange({ ...tags, space: tags.space === value ? "" : value });
  const toggleMulti = (key: MultiTagKey, value: string) => {
    const values = tags[key];
    onChange({ ...tags, [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] });
  };

  return <div className={compact ? "gallery-tag-editor is-compact" : "gallery-tag-editor"}>
    <TagGroup title="공간" options={GALLERY_TAG_OPTIONS.spaces} selected={tags.space ? [tags.space] : []} single onToggle={toggleSpace} />
    <TagGroup title="구조" options={GALLERY_TAG_OPTIONS.structures} selected={tags.structures} onToggle={(value) => toggleMulti("structures", value)} />
    <TagGroup title="스타일" options={GALLERY_TAG_OPTIONS.styles} selected={tags.styles} onToggle={(value) => toggleMulti("styles", value)} />
    <TagGroup title="색상" options={GALLERY_TAG_OPTIONS.colors} selected={tags.colors} onToggle={(value) => toggleMulti("colors", value)} />
    <TagGroup title="소재" options={GALLERY_TAG_OPTIONS.materials} selected={tags.materials} onToggle={(value) => toggleMulti("materials", value)} />
    <TagGroup title="특징" options={GALLERY_TAG_OPTIONS.features} selected={tags.features} onToggle={(value) => toggleMulti("features", value)} />
  </div>;
}

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [processing, setProcessing] = useState(false);
  const [commonTags, setCommonTags] = useState<GalleryTags>(() => cloneTags(EMPTY_GALLERY_TAGS));
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const sync = () => setItems(readGalleryItems());

  useEffect(() => {
    sync();
    window.addEventListener(GALLERY_EVENT, sync);
    return () => window.removeEventListener(GALLERY_EVENT, sync);
  }, []);

  const readyTasks = useMemo(() => tasks.filter((task) => task.status === "ready" && task.src), [tasks]);
  const confirmedCount = readyTasks.filter((task) => task.tags.space).length;
  const missingCount = readyTasks.length - confirmedCount;

  const patchTask = (id: string, patch: Partial<UploadTask>) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  };

  const onFiles = async (files?: FileList | null) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    if (selected.length > MAX_BATCH) {
      showAdminToast(`한 번에 최대 ${MAX_BATCH}장까지 선택할 수 있습니다.`, "error");
      return;
    }

    const nextTasks: UploadTask[] = selected.map((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name.replace(/\.[^.]+$/, ""),
      src: "",
      status: "queued",
      tags: cloneTags(EMPTY_GALLERY_TAGS),
    }));
    setTasks(nextTasks);
    setEditingTaskId(null);
    setCommonTags(cloneTags(EMPTY_GALLERY_TAGS));
    setProcessing(true);

    try {
      await runPool(selected.map((file, index) => ({ file, task: nextTasks[index] })), OPTIMIZE_CONCURRENCY, async ({ file, task }) => {
        patchTask(task.id, { status: "optimizing", error: undefined });
        try {
          const optimized = await optimizeImageFile(file, { maxWidth: 2400, maxHeight: 3200, quality: .90 });
          if (items.some((item) => item.src === optimized)) {
            patchTask(task.id, { status: "failed", error: "이미 등록된 동일한 이미지입니다." });
            return;
          }
          patchTask(task.id, { src: optimized, status: "ready" });
        } catch (error) {
          patchTask(task.id, { status: "failed", error: error instanceof Error ? error.message : "이미지를 처리하지 못했습니다." });
        }
      });
      showAdminToast(`${selected.length}장의 이미지 준비가 끝났습니다. 태그를 선택해 주세요.`);
    } finally {
      setProcessing(false);
    }
  };

  const applyCommonTags = () => {
    if (!readyTasks.length) return;
    setTasks((current) => current.map((task) => task.status === "ready" ? { ...task, tags: cloneTags(commonTags) } : task));
    showAdminToast(`${readyTasks.length}장에 공통 태그를 적용했습니다.`);
  };

  const saveAll = () => {
    if (!readyTasks.length) return showAdminToast("저장할 사진이 없습니다.", "error");
    if (missingCount > 0) {
      setEditingTaskId(readyTasks.find((task) => !task.tags.space)?.id || null);
      return showAdminToast(`공간 태그가 없는 사진이 ${missingCount}장 있습니다.`, "error");
    }

    addGalleryItems(readyTasks.map((task) => ({
      id: task.id,
      src: task.src,
      title: task.fileName || "인테리어 이미지",
      tags: cloneTags(task.tags),
      searchText: [task.fileName, galleryTagsToSearchText(task.tags)].filter(Boolean).join(" "),
    })));
    setTasks([]);
    setEditingTaskId(null);
    setCommonTags(cloneTags(EMPTY_GALLERY_TAGS));
    showAdminToast(`${readyTasks.length}장이 저장되었습니다.`);
  };

  return <div className="admin-stack">
    <section className="admin-card admin-form">
      <div className="admin-heading"><div><h1>GALLERY 관리</h1><p>사진을 선택하고 공간·스타일 태그를 직접 확정한 뒤 저장합니다.</p></div></div>
      <label>이미지 <small>한 번에 최대 10장 · 원본 비율 유지</small><span className="admin-file-picker"><span className="admin-file-picker-icon" aria-hidden="true">↥</span><strong>파일 선택</strong><small>클릭하거나 이미지를 끌어오세요</small><input type="file" accept="image/*" multiple disabled={processing} onChange={(event) => void onFiles(event.target.files)} /></span></label>

      {readyTasks.length > 0 && <section className="gallery-common-tags">
        <div className="gallery-tag-section-heading"><div><h2>전체 사진 공통 태그</h2><p>여기서 고른 태그를 선택한 모든 사진에 한 번에 적용할 수 있습니다.</p></div><button type="button" className="admin-secondary-button" onClick={applyCommonTags}>전체 {readyTasks.length}장에 적용</button></div>
        <TagEditor tags={commonTags} onChange={setCommonTags} compact />
      </section>}

      {tasks.length > 0 && <div className="admin-gallery-batch" aria-live="polite">
        {tasks.map((task, index) => {
          const isEditing = editingTaskId === task.id;
          const selectedTags = [task.tags.space, ...task.tags.structures, ...task.tags.styles, ...task.tags.colors, ...task.tags.materials, ...task.tags.features].filter(Boolean);
          return <article className={`admin-gallery-batch-item is-${task.status}${!task.tags.space && task.status === "ready" ? " is-unconfirmed" : ""}`} key={task.id}>
            <div className="admin-gallery-batch-index">{index + 1}</div>
            <div className="admin-gallery-batch-image">{task.src ? <Image src={task.src} alt={task.fileName} width={300} height={360} unoptimized /> : <span>{task.status === "optimizing" ? "최적화 중" : "대기"}</span>}</div>
            <div className="admin-gallery-batch-meta">
              <strong>{task.fileName}</strong>
              <span>{task.status === "ready" && task.tags.space ? "태그 확정" : statusText(task.status)}</span>
              {selectedTags.length > 0 && <div className="admin-gallery-selected-tags">{selectedTags.map((tag) => <em key={tag}>{tag}</em>)}</div>}
              {task.error && <small className="admin-gallery-batch-warning">{task.error}</small>}
              {task.status === "ready" && <button type="button" className="admin-secondary-button" onClick={() => setEditingTaskId(isEditing ? null : task.id)}>{isEditing ? "태그 닫기" : task.tags.space ? "개별 태그 수정" : "태그 선택"}</button>}
            </div>
            {isEditing && <div className="admin-gallery-individual-tags"><TagEditor tags={task.tags} onChange={(tags) => patchTask(task.id, { tags })} /></div>}
          </article>;
        })}
      </div>}

      {readyTasks.length > 0 && <div className="gallery-save-summary"><span>{confirmedCount}장 태그 확정</span>{missingCount > 0 && <strong>{missingCount}장 공간 태그 필요</strong>}</div>}
      <div className="gallery-admin-actions"><button type="button" className="admin-primary-button" disabled={processing || readyTasks.length === 0} onClick={saveAll}>{processing ? "처리 중…" : readyTasks.length ? `${readyTasks.length}장 저장` : "사진 저장"}</button><a className="admin-filter-button" href="/gallery/?adminDelete=1&returnTo=%2Fadmin%2Fgallery">이미지 삭제</a></div>
    </section>

    <section className="admin-card"><h2>등록된 GALLERY</h2>{items.length === 0 ? <p>추가한 이미지가 없습니다.</p> : <div className="admin-gallery-list">{items.map((item) => <article key={item.id}><Image src={item.src} alt={item.title} width={220} height={280} unoptimized /><div><strong>{item.title}</strong>{item.tags?.space && <span>{[item.tags.space, ...item.tags.styles, ...item.tags.colors].slice(0, 5).join(" · ")}</span>}<a href="/gallery/?adminDelete=1&returnTo=%2Fadmin%2Fgallery">이미지 삭제</a></div></article>)}</div>}</section>
  </div>;
}
