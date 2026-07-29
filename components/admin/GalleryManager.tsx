"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { addGalleryItem, deleteGalleryItem, GALLERY_EVENT, readGalleryItems, type GalleryItem } from "@/lib/gallery-store";
import { optimizeImageFile } from "@/lib/image-optimizer";
import { showAdminToast } from "@/lib/admin-toast";

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [src, setSrc] = useState("");
  const [title, setTitle] = useState("");
  const [space, setSpace] = useState("LIVING");
  const [projectSlug, setProjectSlug] = useState("");
  const sync = () => setItems(readGalleryItems());
  useEffect(() => { sync(); window.addEventListener(GALLERY_EVENT, sync); return () => window.removeEventListener(GALLERY_EVENT, sync); }, []);

  const onFile = async (file?: File) => {
    if (!file) return;
    try { setSrc(await optimizeImageFile(file, { maxWidth: 1600, maxHeight: 2400, quality: .84 })); showAdminToast("이미지가 최적화되었습니다."); }
    catch (error) { showAdminToast(error instanceof Error ? error.message : "이미지를 처리하지 못했습니다.", "error"); }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!src) return showAdminToast("이미지를 선택해 주세요.", "error");
    addGalleryItem({ src, title: title.trim() || "인테리어 디테일", space, projectSlug: projectSlug.trim() || undefined, projectTitle: title.trim() || undefined });
    setSrc(""); setTitle(""); setProjectSlug(""); showAdminToast("GALLERY 이미지가 저장되었습니다.");
  };

  return <div className="admin-stack">
    <form className="admin-card admin-form" onSubmit={onSubmit}>
      <h1>GALLERY 관리</h1><p>집 전체가 아닌 예쁜 공간과 디테일 사진을 한 장씩 등록합니다.</p>
      <label>이미지 <small>권장 업로드: 가로 3200px 이상 · 원본 비율 유지</small><input type="file" accept="image/*" onChange={(e)=>void onFile(e.target.files?.[0])}/></label>
      {src && <div className="admin-gallery-preview"><Image src={src} alt="미리보기" width={700} height={900} unoptimized /></div>}
      <label>제목<input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="예: 웜 그레이 주방 디테일" /></label>
      <label>공간<select value={space} onChange={(e)=>setSpace(e.target.value)}><option>LIVING</option><option>KITCHEN</option><option>BATHROOM</option><option>BEDROOM</option><option>LIGHTING</option><option>TILE</option><option>DETAIL</option><option>ETC</option></select></label>
      <label>연결 프로젝트 슬러그 (선택)<input value={projectSlug} onChange={(e)=>setProjectSlug(e.target.value)} placeholder="예: 20-project-01" /></label>
      <button type="submit" className="admin-primary-button">저장</button>
    </form>
    <section className="admin-card"><h2>등록된 GALLERY</h2>{items.length===0?<p>추가한 이미지가 없습니다.</p>:<div className="admin-gallery-list">{items.map((item)=><article key={item.id}><Image src={item.src} alt={item.title} width={220} height={280} unoptimized/><div><strong>{item.title}</strong><span>{item.space}</span><button type="button" onClick={()=>{if(window.confirm("이 이미지를 삭제하시겠습니까?")){deleteGalleryItem(item.id);showAdminToast("삭제되었습니다.");}}}>삭제</button></div></article>)}</div>}</section>
  </div>;
}
