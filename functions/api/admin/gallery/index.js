import { ensureAdminTables,json,validateSession } from "../../../_shared/admin-auth.js";
import { deleteGallery,ensureGalleryTable,listGallery,upsertGallery } from "../../../_shared/gallery-cms.js";
const VERSION="7.5.15";
async function auth(context){if(!context.env.DB)return{response:json({ok:false,error:"D1 바인딩 DB가 없습니다.",version:VERSION},503)};await ensureAdminTables(context.env.DB);if(!await validateSession(context.env.DB,context.request))return{response:json({ok:false,error:"Unauthorized",version:VERSION},401)};await ensureGalleryTable(context.env.DB);return{db:context.env.DB}}
export async function onRequestGet(context){try{const a=await auth(context);if(a.response)return a.response;return json({ok:true,items:await listGallery(a.db),version:VERSION});}catch(error){return json({ok:false,items:[],error:error instanceof Error?error.message:"갤러리를 불러오지 못했습니다.",version:VERSION},500)}}
export async function onRequestPost(context){
  try{
    const a=await auth(context);if(a.response)return a.response;if(!context.env.PROJECT_MEDIA)return json({ok:false,error:"R2 바인딩 PROJECT_MEDIA가 없습니다.",version:VERSION},503);
    const body=await context.request.json();const items=Array.isArray(body?.items)?body.items:body?.item?[body.item]:[];const stored=[];
    for(const item of items){
      if(!item?.id||!item?.src)continue;
      console.log("[Gallery save v7.5.15] metadata request",{id:String(item.id),src:String(item.src).slice(0,100),client:context.request.headers.get("x-gallery-client-version")||""});
      const saved=await upsertGallery(a.db,context.env.PROJECT_MEDIA,item);
      if(typeof saved?.src!=="string"||!saved.src.startsWith("/api/project-media/"))throw new Error("R2 이미지 주소 검증에 실패했습니다.");
      let confirmed=saved;let verified=true;
      try{
        const confirmedRow=await a.db.prepare("SELECT data FROM cms_gallery WHERE id=?").bind(String(saved.id)).first();
        const parsed=confirmedRow?.data?JSON.parse(confirmedRow.data):null;
        if(parsed&&parsed.src===saved.src)confirmed=parsed;else verified=false;
      }catch(error){verified=false;console.warn("[Gallery save v7.5.15] post-commit verification unavailable",error)}
      // The D1 write already committed. Never convert a post-commit verification issue into a 500 that could trigger R2 rollback.
      stored.push(confirmed);console.log("[Gallery save v7.5.15] committed",{id:String(confirmed.id),src:String(confirmed.src).slice(0,100),verified});
    }
    if(!stored.length)return json({ok:false,error:"저장할 이미지가 없습니다.",version:VERSION},400);
    return json({ok:true,items:stored,version:VERSION});
  }catch(error){console.error("[Gallery save v7.5.15] failed",error);return json({ok:false,error:error instanceof Error?error.message:"갤러리 저장에 실패했습니다.",version:VERSION},500)}
}
export async function onRequestDelete(context){try{const a=await auth(context);if(a.response)return a.response;const body=await context.request.json();if(!body?.id)return json({ok:false,error:"id가 필요합니다.",version:VERSION},400);await deleteGallery(a.db,context.env.PROJECT_MEDIA,body.id);return json({ok:true,version:VERSION});}catch(error){return json({ok:false,error:error instanceof Error?error.message:"갤러리 삭제에 실패했습니다.",version:VERSION},500)}}
