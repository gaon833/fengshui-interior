import { ensureAdminTables, json, validateSession } from "../../../_shared/admin-auth.js";
import { cleanupReplacedContentImages, ensureCmsContentTable, getCmsContent, materializeKnownImages, setCmsContent } from "../../../_shared/cms-content.js";

async function requireAdmin(context) {
  if (!context.env.DB) return { response: json({ ok:false, error:"D1 바인딩 DB가 없습니다." },503) };
  await ensureAdminTables(context.env.DB);
  const session = await validateSession(context.env.DB, context.request);
  if (!session) return { response: json({ ok:false, error:"Unauthorized" },401) };
  await ensureCmsContentTable(context.env.DB);
  return { db:context.env.DB };
}
export async function onRequestGet(context){try{const auth=await requireAdmin(context);if(auth.response)return auth.response;const url=new URL(context.request.url);const key=url.searchParams.get("key");if(!key)return json({ok:false,error:"key가 필요합니다."},400);return json({ok:true,value:await getCmsContent(auth.db,key)});}catch(error){return json({ok:false,error:error instanceof Error?error.message:"불러오기에 실패했습니다."},500)}}
export async function onRequestPost(context){try{const auth=await requireAdmin(context);if(auth.response)return auth.response;const body=await context.request.json();if(!body?.key||body.value==null)return json({ok:false,error:"저장 데이터가 올바르지 않습니다."},400);const key=String(body.key);const previous=await getCmsContent(auth.db,key);const stored=await materializeKnownImages(context.env.PROJECT_MEDIA,key,body.value);await setCmsContent(auth.db,key,stored);await cleanupReplacedContentImages(context.env.PROJECT_MEDIA,key,previous,stored);return json({ok:true,value:stored});}catch(error){return json({ok:false,error:error instanceof Error?error.message:"저장에 실패했습니다."},500)}}
