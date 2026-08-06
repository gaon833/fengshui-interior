"use client";

import type { GalleryTags } from "@/lib/gallery-tags";
export type GalleryAnalysis={caption:string;space:string[];styles:string[];colors:string[];materials:string[];features:string[];keywords:string[];model?:string;analyzedAt?:string};
export type GalleryItem={id:string;src:string;title:string;projectSlug?:string;projectTitle?:string;searchText?:string;analysis?:GalleryAnalysis;tags?:GalleryTags;createdAt:string};
const KEY="fengshui-gallery-v2";const LEGACY_KEY="fengshui-gallery-v1";export const GALLERY_EVENT="fengshui-gallery-updated";
function normalize(items:GalleryItem[]){return [...items].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0))}
export function readGalleryItems():GalleryItem[]{if(typeof window==="undefined")return[];try{const raw=window.localStorage.getItem(KEY)||window.localStorage.getItem(LEGACY_KEY)||"[]";return normalize(JSON.parse(raw) as GalleryItem[])}catch{return[]}}
function cache(items:GalleryItem[]){if(typeof window==="undefined")return;window.localStorage.setItem(KEY,JSON.stringify(normalize(items)));window.dispatchEvent(new CustomEvent(GALLERY_EVENT))}
export async function fetchGalleryItems(admin=false):Promise<GalleryItem[]>{try{const r=await fetch(admin?"/api/admin/gallery":"/api/gallery",{credentials:admin?"include":"same-origin",cache:"no-store"});const d=await r.json().catch(()=>null) as {ok?:boolean;items?:GalleryItem[]}|null;if(!r.ok||!d?.ok||!Array.isArray(d.items))throw new Error();if(admin&&d.items.length===0){const legacy=readGalleryItems();const migratable=legacy.filter(item=>typeof item.src==="string"&&item.src.startsWith("data:image/"));if(migratable.length){const migrated=await saveGalleryItemsToServer(migratable);cache([...migrated,...legacy.filter(item=>!migratable.some(m=>m.id===item.id))]);return normalize([...migrated,...legacy.filter(item=>!migratable.some(m=>m.id===item.id))])}}cache(d.items);return normalize(d.items)}catch{return readGalleryItems()}}

function dataUrlToBlob(value:string):Blob{
  const match=value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if(!match)throw new Error("업로드할 이미지 데이터가 올바르지 않습니다.");
  const binary=atob(match[2]);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type:match[1].toLowerCase()});
}

async function uploadImageToR2(item:GalleryItem):Promise<string>{
  if(typeof item.src!=="string"||!item.src.startsWith("data:image/")){
    if(item.src.startsWith("/api/project-media/"))return item.src;
    throw new Error("새 이미지는 R2 업로드 가능한 이미지 데이터여야 합니다.");
  }
  const blob=dataUrlToBlob(item.src);
  const r=await fetch("/api/admin/media-upload",{
    method:"POST",
    headers:{"content-type":blob.type||"image/webp","x-media-namespace":"gallery","x-media-label":item.id||"image"},
    credentials:"include",
    body:blob,
  });
  const d=await r.json().catch(()=>null) as {ok?:boolean;url?:string;error?:string}|null;
  if(!r.ok||!d?.ok||typeof d.url!=="string"||!d.url.startsWith("/api/project-media/"))throw new Error(d?.error||"R2 이미지 업로드에 실패했습니다.");
  return d.url;
}

async function cleanupUploadedUrl(url:string){
  if(!url.startsWith("/api/project-media/"))return;
  await fetch("/api/admin/media-upload",{method:"DELETE",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({url})}).catch(()=>undefined);
}

export async function saveGalleryItemsToServer(items:GalleryItem[]):Promise<GalleryItem[]>{
  const stored:GalleryItem[]=[];
  for(const item of items){
    let uploadedUrl="";
    try{
      uploadedUrl=await uploadImageToR2(item);
      const payload:GalleryItem={...item,src:uploadedUrl};
      const r=await fetch("/api/admin/gallery",{method:"POST",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({item:payload})});
      const d=await r.json().catch(()=>null) as {ok?:boolean;items?:GalleryItem[];error?:string}|null;
      if(!r.ok||!d?.ok||!Array.isArray(d.items)||!d.items[0])throw new Error(d?.error||"갤러리 정보 저장에 실패했습니다.");
      const saved=d.items[0];
      if(typeof saved.src!=="string"||!saved.src.startsWith("/api/project-media/"))throw new Error("R2 저장 확인에 실패했습니다. 저장을 중단했습니다.");
      stored.push(saved);
    }catch(error){
      if(uploadedUrl&&uploadedUrl!==item.src)await cleanupUploadedUrl(uploadedUrl);
      throw error;
    }
  }
  return stored;
}
export async function addGalleryItems(items:Array<Omit<GalleryItem,"id"|"createdAt">&{id?:string}>){const t=Date.now();const prepared:GalleryItem[]=items.map((item,index)=>({...item,id:item.id||crypto.randomUUID(),createdAt:new Date(t+index).toISOString()}));const stored=await saveGalleryItemsToServer(prepared);cache([...stored,...readGalleryItems().filter(old=>!stored.some(n=>n.id===old.id))]);return stored}
export async function deleteGalleryItem(id:string){const r=await fetch("/api/admin/gallery",{method:"DELETE",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({id})});if(!r.ok)throw new Error("갤러리 서버 삭제에 실패했습니다.");cache(readGalleryItems().filter(item=>item.id!==id))}
const HIDDEN_KEY="fengshui-gallery-hidden-v1";export function readHiddenGalleryIds():string[]{if(typeof window==="undefined")return[];try{return JSON.parse(window.localStorage.getItem(HIDDEN_KEY)||"[]") as string[]}catch{return[]}}
export function hideGalleryItem(id:string){const next=Array.from(new Set([...readHiddenGalleryIds(),id]));window.localStorage.setItem(HIDDEN_KEY,JSON.stringify(next));window.dispatchEvent(new CustomEvent(GALLERY_EVENT))}
