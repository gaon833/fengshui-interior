import { ensureAdminTables,json,validateSession } from "../../../_shared/admin-auth.js";
import { deleteGallery,ensureGalleryTable,listGallery,upsertGallery } from "../../../_shared/gallery-cms.js";
const VERSION="7.5.16";
function safeSegment(value){return String(value||"gallery").replace(/[^a-zA-Z0-9_-]+/g,"-").slice(0,80)||"gallery"}
function extFor(type){if(type==="image/jpeg")return"jpg";if(type==="image/png")return"png";if(type==="image/gif")return"gif";return"webp"}
async function auth(context){if(!context.env.DB)return{response:json({ok:false,error:"D1 바인딩 DB가 없습니다.",version:VERSION},503)};await ensureAdminTables(context.env.DB);if(!await validateSession(context.env.DB,context.request))return{response:json({ok:false,error:"Unauthorized",version:VERSION},401)};await ensureGalleryTable(context.env.DB);return{db:context.env.DB}}
export async function onRequestGet(context){try{const a=await auth(context);if(a.response)return a.response;return json({ok:true,items:await listGallery(a.db),version:VERSION});}catch(error){return json({ok:false,items:[],error:error instanceof Error?error.message:"갤러리를 불러오지 못했습니다.",version:VERSION},500)}}

async function saveMultipart(context,a){
  if(!context.env.PROJECT_MEDIA)return json({ok:false,error:"R2 바인딩 PROJECT_MEDIA가 없습니다.",version:VERSION,stage:"binding"},503);
  let key="";let url="";let itemId="";
  try{
    const form=await context.request.formData();
    const raw=form.get("metadata");const image=form.get("image");
    if(typeof raw!=="string")return json({ok:false,error:"metadata가 없습니다.",version:VERSION,stage:"parse"},400);
    const item=JSON.parse(raw);
    if(!item?.id)return json({ok:false,error:"이미지 id가 없습니다.",version:VERSION,stage:"parse"},400);
    itemId=String(item.id);
    if(!(image instanceof File))return json({ok:false,error:"이미지 파일이 없습니다.",version:VERSION,stage:"parse"},400);
    const contentType=(image.type||"image/webp").toLowerCase();const allowed=new Set(["image/webp","image/jpeg","image/png","image/gif"]);
    if(!allowed.has(contentType))return json({ok:false,error:"지원하지 않는 이미지 형식입니다.",version:VERSION,stage:"validate"},415);
    if(image.size<=0||image.size>12*1024*1024)return json({ok:false,error:"이미지는 1바이트 이상 12MB 이하여야 합니다.",version:VERSION,stage:"validate"},413);
    key=`gallery--${safeSegment(item.id)}--${crypto.randomUUID()}.${extFor(contentType)}`;
    const bytes=await image.arrayBuffer();
    console.log("[Gallery atomic v7.5.16] put:start",{key,bytes:bytes.byteLength,client:context.request.headers.get("x-gallery-client-version")||""});
    await context.env.PROJECT_MEDIA.put(key,bytes,{httpMetadata:{contentType,cacheControl:"public, max-age=31536000, immutable"}});
    const head=await context.env.PROJECT_MEDIA.head(key);
    if(!head||Number(head.size)!==bytes.byteLength)throw new Error("R2 PUT 직후 객체 크기 검증에 실패했습니다.");
    url=`/api/project-media/${encodeURIComponent(key)}`;
    const saved=await upsertGallery(a.db,context.env.PROJECT_MEDIA,{...item,src:url});
    const row=await a.db.prepare("SELECT data FROM cms_gallery WHERE id=?").bind(String(saved.id)).first();
    const confirmed=row?.data?JSON.parse(row.data):null;
    if(!confirmed||confirmed.src!==url)throw new Error("D1 저장 후 R2 URL 재조회 검증에 실패했습니다.");
    console.log("[Gallery atomic v7.5.16] committed",{id:String(saved.id),key,bytes:bytes.byteLength});
    return json({ok:true,items:[confirmed],version:VERSION,stage:"committed"});
  }catch(error){
    // If the D1 row points at this R2 URL, the commit succeeded: never delete the object.
    let committed=false;
    // Safer rule: only rollback R2 when no gallery row references this URL.
    if(url&&itemId){try{const ref=await a.db.prepare("SELECT data FROM cms_gallery WHERE id=?").bind(itemId).first();const parsed=ref?.data?JSON.parse(ref.data):null;committed=parsed?.src===url}catch{committed=true}}
    if(key&&!committed&&context.env.PROJECT_MEDIA)await context.env.PROJECT_MEDIA.delete(key).catch(()=>undefined);
    console.error("[Gallery atomic v7.5.16] failed",{key,url,committed,error});
    return json({ok:false,error:error instanceof Error?error.message:"갤러리 원자 저장에 실패했습니다.",version:VERSION,stage:committed?"post-commit":"pre-commit"},500);
  }
}

export async function onRequestPost(context){
  try{
    const a=await auth(context);if(a.response)return a.response;
    const type=(context.request.headers.get("content-type")||"").toLowerCase();
    if(type.includes("multipart/form-data"))return await saveMultipart(context,a);
    if(!context.env.PROJECT_MEDIA)return json({ok:false,error:"R2 바인딩 PROJECT_MEDIA가 없습니다.",version:VERSION},503);
    const body=await context.request.json();const items=Array.isArray(body?.items)?body.items:body?.item?[body.item]:[];const stored=[];
    for(const item of items){if(!item?.id||!item?.src)continue;const saved=await upsertGallery(a.db,context.env.PROJECT_MEDIA,item);if(typeof saved?.src!=="string"||!saved.src.startsWith("/api/project-media/"))throw new Error("R2 이미지 주소 검증에 실패했습니다.");stored.push(saved)}
    if(!stored.length)return json({ok:false,error:"저장할 이미지가 없습니다.",version:VERSION},400);
    return json({ok:true,items:stored,version:VERSION});
  }catch(error){console.error("[Gallery save v7.5.16] failed",error);return json({ok:false,error:error instanceof Error?error.message:"갤러리 저장에 실패했습니다.",version:VERSION},500)}
}
export async function onRequestDelete(context){try{const a=await auth(context);if(a.response)return a.response;const body=await context.request.json();if(!body?.id)return json({ok:false,error:"id가 필요합니다.",version:VERSION},400);await deleteGallery(a.db,context.env.PROJECT_MEDIA,body.id);return json({ok:true,version:VERSION});}catch(error){return json({ok:false,error:error instanceof Error?error.message:"갤러리 삭제에 실패했습니다.",version:VERSION},500)}}
