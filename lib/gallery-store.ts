"use client";

import type { GalleryTags } from "@/lib/gallery-tags";

export type GalleryAnalysis={caption:string;space:string[];styles:string[];colors:string[];materials:string[];features:string[];keywords:string[];model?:string;analyzedAt?:string};
export type GalleryItem={id:string;src:string;title:string;projectSlug?:string;projectTitle?:string;searchText?:string;analysis?:GalleryAnalysis;tags?:GalleryTags;createdAt:string};

const KEY="fengshui-gallery-v2";
const LEGACY_KEY="fengshui-gallery-v1";
const HIDDEN_KEY="fengshui-gallery-hidden-v1";
export const GALLERY_EVENT="fengshui-gallery-updated";
export const GALLERY_CLIENT_VERSION="7.5.15";
const R2_MEDIA_ROUTE="/api/admin/media-upload";
const R2_HEALTH_ROUTE="/api/admin/r2-health?probe=1";

function normalize(items:GalleryItem[]){return [...items].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0))}
export function readGalleryItems():GalleryItem[]{if(typeof window==="undefined")return[];try{const raw=window.localStorage.getItem(KEY)||window.localStorage.getItem(LEGACY_KEY)||"[]";return normalize(JSON.parse(raw) as GalleryItem[])}catch{return[]}}
function cache(items:GalleryItem[]){if(typeof window==="undefined")return;window.localStorage.setItem(KEY,JSON.stringify(normalize(items)));window.dispatchEvent(new CustomEvent(GALLERY_EVENT))}
async function readJson<T>(response:Response):Promise<T|null>{return response.json().catch(()=>null) as Promise<T|null>}

export async function fetchGalleryItems(admin=false):Promise<GalleryItem[]>{
  const response=await fetch(admin?"/api/admin/gallery":"/api/gallery",{credentials:"same-origin",cache:"no-store",headers:{"x-gallery-client-version":GALLERY_CLIENT_VERSION}});
  const data=await readJson<{ok?:boolean;items?:GalleryItem[];error?:string}>(response);
  if(!response.ok||!data?.ok||!Array.isArray(data.items)){
    if(admin)throw new Error(data?.error||`관리자 갤러리 서버 연결 실패 (${response.status})`);
    return readGalleryItems();
  }
  cache(data.items);
  return normalize(data.items);
}

export async function probeR2():Promise<{version:string;message:string}>{
  const response=await fetch(R2_HEALTH_ROUTE,{credentials:"same-origin",cache:"no-store",headers:{"x-gallery-client-version":GALLERY_CLIENT_VERSION}});
  const data=await readJson<{ok?:boolean;version?:string;error?:string;writeProbe?:boolean}>(response);
  if(!response.ok||!data?.ok||!data.writeProbe)throw new Error(data?.error||`R2 쓰기 확인 실패 (${response.status})`);
  const version=data.version||GALLERY_CLIENT_VERSION;
  return {version,message:`R2 읽기·쓰기 확인 정상 · v${version}`};
}

function dataUrlToBlob(value:string):Blob{
  const match=value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if(!match)throw new Error("업로드할 이미지 데이터가 올바르지 않습니다.");
  const binary=atob(match[2]);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type:match[1].toLowerCase()});
}

async function verifyReadable(url:string){
  const response=await fetch(url,{method:"GET",cache:"no-store",credentials:"same-origin"});
  if(!response.ok)throw new Error(`R2 저장 후 이미지 조회 검증 실패 (${response.status})`);
  await response.body?.cancel().catch(()=>undefined);
}

async function uploadImageToR2(item:GalleryItem):Promise<string>{
  if(typeof item.src!=="string"||!item.src.startsWith("data:image/")){
    if(item.src.startsWith("/api/project-media/")){await verifyReadable(item.src);return item.src;}
    throw new Error("새 이미지는 R2 업로드 가능한 이미지 데이터여야 합니다.");
  }
  const blob=dataUrlToBlob(item.src);
  const response=await fetch(R2_MEDIA_ROUTE,{method:"POST",headers:{"content-type":blob.type||"image/webp","x-media-namespace":"gallery","x-media-label":item.id||"image","x-gallery-client-version":GALLERY_CLIENT_VERSION},credentials:"same-origin",cache:"no-store",body:blob});
  const data=await readJson<{ok?:boolean;url?:string;error?:string;version?:string}>(response);
  if(!response.ok||!data?.ok||typeof data.url!=="string"||!data.url.startsWith("/api/project-media/"))throw new Error(data?.error||`R2 이미지 업로드 실패 (${response.status})`);
  await verifyReadable(data.url);
  return data.url;
}

async function cleanupUploadedUrl(url:string){
  if(!url.startsWith("/api/project-media/"))return;
  await fetch(R2_MEDIA_ROUTE,{method:"DELETE",headers:{"content-type":"application/json","x-gallery-client-version":GALLERY_CLIENT_VERSION},credentials:"same-origin",cache:"no-store",body:JSON.stringify({url})}).catch(()=>undefined);
}

export async function saveGalleryItemsToServer(items:GalleryItem[]):Promise<GalleryItem[]>{
  const stored:GalleryItem[]=[];
  for(const item of items){
    const uploadedUrl=await uploadImageToR2(item);
    const payload:GalleryItem={...item,src:uploadedUrl};
    let response:Response;
    try{
      response=await fetch("/api/admin/gallery",{method:"POST",headers:{"content-type":"application/json","x-gallery-client-version":GALLERY_CLIENT_VERSION},credentials:"same-origin",cache:"no-store",body:JSON.stringify({item:payload})});
    }catch(error){
      // The request may have reached D1 even if the browser lost the response. Never delete the R2 object in this ambiguous state.
      throw new Error(error instanceof Error?`갤러리 저장 응답을 받지 못했습니다. 새로고침 후 등록 여부를 확인해 주세요. (${error.message})`:"갤러리 저장 응답을 받지 못했습니다. 새로고침 후 등록 여부를 확인해 주세요.");
    }
    const data=await readJson<{ok?:boolean;items?:GalleryItem[];error?:string;version?:string}>(response);
    if(!response.ok||!data?.ok||!Array.isArray(data.items)||!data.items[0]){
      // v7.5.15 server contract: non-2xx means the D1 commit did not complete, so cleanup is safe.
      if(uploadedUrl!==item.src)await cleanupUploadedUrl(uploadedUrl);
      throw new Error(data?.error||`갤러리 정보 저장 실패 (${response.status})`);
    }
    const saved=data.items[0];
    if(typeof saved.src!=="string"||saved.src!==uploadedUrl||!saved.src.startsWith("/api/project-media/"))throw new Error("D1에 저장된 R2 주소 검증에 실패했습니다. 파일은 보존했으므로 새로고침 후 상태를 확인해 주세요.");
    // This check happens after commit. Failure is reported, but committed media is deliberately preserved.
    await verifyReadable(saved.src);
    stored.push(saved);
  }
  try{cache(await fetchGalleryItems(true));}catch{/* committed rows remain authoritative on the server */}
  return stored;
}

export async function addGalleryItems(items:Array<Omit<GalleryItem,"id"|"createdAt">&{id?:string}>){
  const t=Date.now();
  const prepared:GalleryItem[]=items.map((item,index)=>({...item,id:item.id||crypto.randomUUID(),createdAt:new Date(t+index).toISOString()}));
  const stored=await saveGalleryItemsToServer(prepared);
  cache([...stored,...readGalleryItems().filter(old=>!stored.some(next=>next.id===old.id))]);
  return stored;
}

export async function deleteGalleryItem(id:string){
  const response=await fetch("/api/admin/gallery",{method:"DELETE",headers:{"content-type":"application/json","x-gallery-client-version":GALLERY_CLIENT_VERSION},credentials:"same-origin",cache:"no-store",body:JSON.stringify({id})});
  const data=await readJson<{ok?:boolean;error?:string}>(response);
  if(!response.ok||!data?.ok)throw new Error(data?.error||"갤러리 서버 삭제에 실패했습니다.");
  cache(readGalleryItems().filter(item=>item.id!==id));
}

export function readHiddenGalleryIds():string[]{if(typeof window==="undefined")return[];try{return JSON.parse(window.localStorage.getItem(HIDDEN_KEY)||"[]") as string[]}catch{return[]}}
export function hideGalleryItem(id:string){const next=Array.from(new Set([...readHiddenGalleryIds(),id]));window.localStorage.setItem(HIDDEN_KEY,JSON.stringify(next));window.dispatchEvent(new CustomEvent(GALLERY_EVENT))}
