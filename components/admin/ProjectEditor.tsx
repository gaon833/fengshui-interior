"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { Project, ProjectCardLayout, ProjectCategory, ProjectStatus } from "@/types/project";
import { fileToDataUrl, makeProjectImage, readStoredProjects, saveStoredProjects } from "@/lib/project-store";
import { showAdminToast } from "@/lib/admin-toast";
import { IMAGE_GUIDES, guideText, confirmImageRatio } from "@/lib/image-guidelines";

const blank = (): Project => ({
  id: `project-${Date.now()}`, slug: `project-${Date.now()}`, title: "", category: "30", useType: "Residential", location: "", area: "", year: new Date().getFullYear(), tags: [], coverImage: "", mobileCoverImage: "", images: [], order: 999, status: "draft", featured: false, cardLayout: "wide", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), seo: { title: "", description: "", ogImage: "" }, revisions: [],
});

export default function ProjectEditor({ defaults, initialProject }: { defaults: Project[]; initialProject?: Project }) {
  const params = useSearchParams(); const router = useRouter(); const editId = params.get("id") ?? initialProject?.id ?? null;
  const [project, setProject] = useState<Project>(blank()); const [message, setMessage] = useState("");
  useEffect(() => { const items = readStoredProjects(defaults); const found = editId ? items.find((item) => item.id === editId) ?? initialProject : undefined; setProject(found ? structuredClone(found) : blank()); }, [defaults, editId, initialProject]);
  const preview = useMemo(() => project.coverImage || project.images[0]?.src || "", [project]);
  const patch = <K extends keyof Project>(key: K, value: Project[K]) => setProject((current) => ({ ...current, [key]: value }));

  const uploadCover = async (event: ChangeEvent<HTMLInputElement>, mobile = false) => { const file = event.target.files?.[0]; if (!file) return; try { const guide = mobile ? IMAGE_GUIDES.projectMobile : IMAGE_GUIDES.projectPc; if (!(await confirmImageRatio(file, guide))) { event.target.value = ""; return; } const src = await fileToDataUrl(file); patch(mobile ? "mobileCoverImage" : "coverImage", src); showAdminToast(`${mobile ? "모바일" : "PC"} 대표 이미지가 추가되었습니다. 저장 버튼을 눌러 적용하세요.`, "success"); } catch { showAdminToast("대표 이미지 업로드에 실패했습니다.", "error"); } };
  const uploadDetails = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    try {
      const start = project.images.length;
      const additions = await Promise.all(files.map(async (file, i) =>
        makeProjectImage(await fileToDataUrl(file), project.title, start + i + 1),
      ));
      patch("images", [...project.images, ...additions]);
      showAdminToast(`상세 이미지 ${additions.length}장이 최적화되어 추가되었습니다.`, "success");
      event.target.value = "";
    } catch {
      showAdminToast("상세 이미지 업로드에 실패했습니다.", "error");
    }
  };
  const moveImage = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= project.images.length) return; const images = [...project.images]; [images[index], images[target]] = [images[target], images[index]]; patch("images", images.map((img, i) => ({ ...img, order: i + 1 }))); };
  const removeImage = (id: string) => { patch("images", project.images.filter((img) => img.id !== id).map((img, i) => ({ ...img, order: i + 1 }))); showAdminToast("이미지가 삭제되었습니다.", "success"); };

  const save = (event: FormEvent) => {
    event.preventDefault(); if (!project.title.trim() || !project.location.trim() || !project.area.trim() || !project.coverImage) { const text = "프로젝트명, 지역, 평형, 대표 이미지는 필수입니다."; setMessage(text); showAdminToast(text, "error"); return; }
    const items = readStoredProjects(defaults); const exists = items.some((item) => item.id === project.id); const now = new Date().toISOString(); const slugBase = project.slug.trim() || project.title.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
    const saved: Project = { ...project, slug: slugBase || project.id, tags: project.tags.filter(Boolean), order: exists ? project.order : Math.max(0, ...items.map((item) => item.order)) + 1, updatedAt: now, seo: { ...project.seo, title: project.seo.title || `${project.title} | 풍수 인테리어`, ogImage: project.seo.ogImage || project.coverImage }, revisions: [...project.revisions, { id: `revision-${Date.now()}`, createdAt: now, note: exists ? "관리자 수정" : "관리자 등록" }] };
    const next = exists ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved]; saveStoredProjects(next); setProject(saved); const text = exists ? "프로젝트 수정 내용이 저장되었습니다." : "새 프로젝트가 저장되었습니다."; setMessage(text); showAdminToast(text, "success"); if (!editId) router.replace(`/admin/projects/new/?id=${encodeURIComponent(saved.id)}`);
  };

  return <form className="project-editor" onSubmit={save}>
    <header className="editor-header"><div><h1>{editId ? "프로젝트 수정" : "새 프로젝트 등록"}</h1><p>대표 이미지와 상세 이미지는 브라우저에 저장됩니다.</p></div><div className="editor-actions"><Link href="/admin/projects/">목록</Link><button type="submit">저장</button></div></header>
    {message && <div className="admin-save-message">{message}</div>}
    <div className="editor-grid">
      <section className="editor-panel"><h2>기본 정보</h2>
        <label>프로젝트명<input value={project.title} onChange={(e) => patch("title", e.target.value)} /></label>
        <label>주소용 슬러그<input value={project.slug} onChange={(e) => patch("slug", e.target.value)} /></label>
        <label>지역<input value={project.location} onChange={(e) => patch("location", e.target.value)} placeholder="서울" /></label>
        <label>평형<input value={project.area} onChange={(e) => patch("area", e.target.value)} placeholder="112㎡ (34평)" /></label>
        <label>평형 필터<select value={project.category} onChange={(e) => patch("category", e.target.value as ProjectCategory)}><option value="20">20</option><option value="30">30</option><option value="40">40</option><option value="50">50</option><option value="60">60</option><option value="C">C</option></select></label>
        <label>연도<input type="number" value={project.year} onChange={(e) => patch("year", Number(e.target.value))} /></label>
        <label>태그<input value={project.tags.join(", ")} onChange={(e) => patch("tags", e.target.value.split(",").map((v) => v.trim()))} /></label>
        <label>상태<select value={project.status} onChange={(e) => patch("status", e.target.value as ProjectStatus)}><option value="draft">작성 중</option><option value="published">공개</option><option value="private">비공개</option><option value="trash">휴지통</option></select></label>
        <label>카드 형태<select value={project.cardLayout ?? "wide"} onChange={(e) => patch("cardLayout", e.target.value as ProjectCardLayout)}><option value="wide">가로</option><option value="portrait">세로</option><option value="square">정사각형</option></select></label>
      </section>
      <section className="editor-panel project-image-manager"><h2>프로젝트 이미지</h2>
        {preview && <div className="admin-image-preview"><Image src={preview} alt="대표 이미지 미리보기" width={720} height={480} unoptimized={preview.startsWith("data:")} /></div>}
        <label>PC 대표 이미지 <span className="admin-image-guide">{guideText(IMAGE_GUIDES.projectPc)}</span><input type="file" accept="image/*" onChange={(e) => uploadCover(e)} /></label>
        <label>모바일 대표 이미지 <span className="admin-image-guide">{guideText(IMAGE_GUIDES.projectMobile)}</span><input type="file" accept="image/*" onChange={(e) => uploadCover(e, true)} />{project.mobileCoverImage ? <span className="admin-upload-preview"><img src={project.mobileCoverImage} alt="모바일 대표 이미지 미리보기" /></span> : null}</label>
        <div className="project-detail-upload-block">
          <h3>상세 이미지</h3>
          <p className="admin-image-guide">가로: {guideText(IMAGE_GUIDES.detailLandscape)}<br />세로: {guideText(IMAGE_GUIDES.detailPortrait)}</p>
          <label>상세 이미지 여러 장 선택<input type="file" accept="image/*" multiple onChange={uploadDetails} /></label>
          <p className="admin-note">고화질 원본을 올리면 자동으로 크기와 용량을 줄여 WebP로 저장합니다.</p>
          {project.images.length ? <div className="admin-image-list">{project.images.map((image, index) => <article key={image.id}><Image src={image.src} alt={image.alt} width={260} height={180} unoptimized={image.src.startsWith("data:")} /><div><button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => moveImage(index, 1)} disabled={index === project.images.length - 1}>↓</button><button type="button" onClick={() => removeImage(image.id)}>삭제</button></div></article>)}</div> : <p className="admin-empty-state">등록된 상세 이미지가 없습니다.</p>}
        </div>
      </section>
      <section className="editor-panel"><h2>SEO</h2><label>SEO 제목<input value={project.seo.title} onChange={(e) => patch("seo", { ...project.seo, title: e.target.value })} /></label><label>SEO 설명<textarea value={project.seo.description} onChange={(e) => patch("seo", { ...project.seo, description: e.target.value })} /></label></section>
    </div>
  </form>;
}
