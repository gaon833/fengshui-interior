import { ensureAdminTables, json, validateSession } from "../../_shared/admin-auth.js";
const VERSION="7.5.15";
export async function onRequestGet(context){
  let probeKey="";
  try{
    if(!context.env.DB)return json({ok:false,error:"D1 바인딩 DB가 없습니다.",version:VERSION},503);
    await ensureAdminTables(context.env.DB);
    if(!await validateSession(context.env.DB,context.request))return json({ok:false,error:"관리자 세션이 유효하지 않습니다. 다시 로그인해 주세요.",version:VERSION},401);
    if(!context.env.PROJECT_MEDIA)return json({ok:false,error:"R2 바인딩 PROJECT_MEDIA가 없습니다.",version:VERSION},503);
    await context.env.PROJECT_MEDIA.list({limit:1});
    const url=new URL(context.request.url);let writeProbe=false;
    if(url.searchParams.get("probe")==="1"){
      probeKey=`health--v7515--${crypto.randomUUID()}.txt`;
      const bytes=new TextEncoder().encode("r2-ok");
      await context.env.PROJECT_MEDIA.put(probeKey,bytes,{httpMetadata:{contentType:"text/plain",cacheControl:"no-store"}});
      const head=await context.env.PROJECT_MEDIA.head(probeKey);if(!head||Number(head.size)!==bytes.byteLength)throw new Error("R2 쓰기 후 확인에 실패했습니다.");
      const object=await context.env.PROJECT_MEDIA.get(probeKey);if(!object)throw new Error("R2 읽기 확인에 실패했습니다.");
      await context.env.PROJECT_MEDIA.delete(probeKey);probeKey="";writeProbe=true;
    }
    console.log("[R2 health v7.5.15] ok",{writeProbe});
    return json({ok:true,r2:true,writeProbe,version:VERSION});
  }catch(error){
    if(probeKey&&context.env.PROJECT_MEDIA)await context.env.PROJECT_MEDIA.delete(probeKey).catch(()=>undefined);
    console.error("[R2 health v7.5.15] failed",error);
    return json({ok:false,error:error instanceof Error?error.message:"R2 연결 확인에 실패했습니다.",version:VERSION},500);
  }
}
