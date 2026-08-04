import { json } from "../../_shared/admin-auth.js";
import { ensureGalleryTable,listGallery } from "../../_shared/gallery-cms.js";
export async function onRequestGet(context){try{if(!context.env.DB)return json({ok:false,items:[],error:"D1 바인딩 DB가 없습니다."},503);await ensureGalleryTable(context.env.DB);return json({ok:true,items:await listGallery(context.env.DB)});}catch(error){return json({ok:false,items:[],error:error instanceof Error?error.message:"갤러리를 불러오지 못했습니다."},500)}}
