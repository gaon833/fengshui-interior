import { ensureAdminTables, json, validateSession } from "../../_shared/admin-auth.js";
const VERSION="7.5.16";
export async function onRequestGet(context){
  try{
    if(!context.env.DB)return json({ok:false,error:"D1 바인딩 DB가 없습니다.",version:VERSION},503);
    await ensureAdminTables(context.env.DB);
    if(!await validateSession(context.env.DB,context.request))return json({ok:false,error:"관리자 세션이 유효하지 않습니다. 다시 로그인해 주세요.",version:VERSION},401);
    if(!context.env.PROJECT_MEDIA)return json({ok:false,error:"R2 바인딩 PROJECT_MEDIA가 없습니다.",version:VERSION},503);
    const result=await context.env.PROJECT_MEDIA.list({limit:1});
    console.log("[R2 health v7.5.16] binding ok",{objectsSeen:Array.isArray(result?.objects)?result.objects.length:0});
    return json({ok:true,r2:true,version:VERSION});
  }catch(error){console.error("[R2 health v7.5.16] failed",error);return json({ok:false,error:error instanceof Error?error.message:"R2 연결 확인에 실패했습니다.",version:VERSION},500)}
}
