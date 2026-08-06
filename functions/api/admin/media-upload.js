import { ensureAdminTables, json, validateSession } from "../../_shared/admin-auth.js";
const VERSION="7.5.15";
function safeSegment(value){return String(value||"media").replace(/[^a-zA-Z0-9_-]+/g,"-").slice(0,80)||"media"}
function extFor(contentType){if(contentType==="image/jpeg")return"jpg";if(contentType==="image/png")return"png";if(contentType==="image/gif")return"gif";return"webp"}
async function requireAdmin(context){
  if(!context.env.DB)return{response:json({ok:false,error:"D1 바인딩 DB가 없습니다.",version:VERSION},503)};
  if(!context.env.PROJECT_MEDIA)return{response:json({ok:false,error:"R2 바인딩 PROJECT_MEDIA가 없습니다.",version:VERSION},503)};
  await ensureAdminTables(context.env.DB);
  const session=await validateSession(context.env.DB,context.request);
  if(!session)return{response:json({ok:false,error:"관리자 세션이 유효하지 않습니다. 다시 로그인해 주세요.",version:VERSION},401)};
  return{bucket:context.env.PROJECT_MEDIA};
}
export async function onRequestPost(context){
  let key="";
  try{
    const auth=await requireAdmin(context);if(auth.response)return auth.response;
    const contentType=(context.request.headers.get("content-type")||"").split(";")[0].toLowerCase();
    const allowed=new Set(["image/webp","image/jpeg","image/png","image/gif"]);
    if(!allowed.has(contentType))return json({ok:false,error:"지원하지 않는 이미지 형식입니다.",version:VERSION},415);
    const length=Number(context.request.headers.get("content-length")||0);
    if(length>12*1024*1024)return json({ok:false,error:"최적화된 이미지는 12MB 이하만 업로드할 수 있습니다.",version:VERSION},413);
    const body=await context.request.arrayBuffer();
    console.log("[R2 media-upload v7.5.15] request",{contentType,bytes:body.byteLength,client:context.request.headers.get("x-gallery-client-version")||""});
    if(!body.byteLength)return json({ok:false,error:"이미지 데이터가 비어 있습니다.",version:VERSION},400);
    if(body.byteLength>12*1024*1024)return json({ok:false,error:"최적화된 이미지는 12MB 이하만 업로드할 수 있습니다.",version:VERSION},413);
    const namespace=safeSegment(context.request.headers.get("x-media-namespace")||"media");
    const label=safeSegment(context.request.headers.get("x-media-label")||"image");
    key=`${namespace}--${label}--${crypto.randomUUID()}.${extFor(contentType)}`;
    await auth.bucket.put(key,body,{httpMetadata:{contentType,cacheControl:"public, max-age=31536000, immutable"}});
    const head=await auth.bucket.head(key);
    if(!head||Number(head.size)!==body.byteLength)throw new Error("R2 저장 직후 크기 검증에 실패했습니다.");
    console.log("[R2 media-upload v7.5.15] stored",{key,bytes:body.byteLength});
    return json({ok:true,url:`/api/project-media/${encodeURIComponent(key)}`,bytes:body.byteLength,version:VERSION});
  }catch(error){
    if(key&&context.env.PROJECT_MEDIA)await context.env.PROJECT_MEDIA.delete(key).catch(()=>undefined);
    console.error("[R2 media-upload v7.5.15] failed",error);
    return json({ok:false,error:error instanceof Error?error.message:"이미지 업로드에 실패했습니다.",version:VERSION},500);
  }
}
function managedKey(value){if(typeof value!=="string"||!value.startsWith("/api/project-media/"))return null;try{return decodeURIComponent(value.slice("/api/project-media/".length))}catch{return null}}
export async function onRequestDelete(context){
  try{
    const auth=await requireAdmin(context);if(auth.response)return auth.response;
    const body=await context.request.json().catch(()=>null);const urls=Array.isArray(body?.urls)?body.urls:body?.url?[body.url]:[];
    for(const url of urls.slice(0,100)){const key=managedKey(url);if(key)await auth.bucket.delete(key).catch(()=>undefined)}
    return json({ok:true,version:VERSION});
  }catch(error){return json({ok:false,error:error instanceof Error?error.message:"임시 이미지 정리에 실패했습니다.",version:VERSION},500)}
}
