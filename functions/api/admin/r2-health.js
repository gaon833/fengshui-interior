import { ensureAdminTables, json, validateSession } from "../../_shared/admin-auth.js";
export async function onRequestGet(context){
  try{
    if(!context.env.DB)return json({ok:false,error:"D1 바인딩 DB가 없습니다.",version:"7.5.13"},503);
    await ensureAdminTables(context.env.DB);
    if(!await validateSession(context.env.DB,context.request))return json({ok:false,error:"Unauthorized",version:"7.5.13"},401);
    if(!context.env.PROJECT_MEDIA)return json({ok:false,error:"R2 바인딩 PROJECT_MEDIA가 없습니다.",version:"7.5.13"},503);
    const result=await context.env.PROJECT_MEDIA.list({limit:1});
    return json({ok:true,r2:true,objectCountSample:(result.objects||[]).length,version:"7.5.13"});
  }catch(error){return json({ok:false,error:error instanceof Error?error.message:"R2 연결 확인에 실패했습니다.",version:"7.5.13"},500)}
}
