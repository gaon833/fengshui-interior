import { deleteManagedImage, materializeImage } from "./cms-content.js";
export async function ensureGalleryTable(db){await db.prepare(`CREATE TABLE IF NOT EXISTS cms_gallery (id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at INTEGER NOT NULL)`).run();await db.prepare("CREATE INDEX IF NOT EXISTS idx_cms_gallery_created ON cms_gallery(created_at)").run();}
export async function listGallery(db){const result=await db.prepare("SELECT data FROM cms_gallery ORDER BY created_at DESC").all();return (result.results||[]).map(r=>{try{return JSON.parse(r.data)}catch{return null}}).filter(Boolean)}
export async function upsertGallery(db,bucket,item){
  const oldRow=await db.prepare("SELECT data FROM cms_gallery WHERE id=?").bind(String(item.id)).first();let old=null;try{old=oldRow?.data?JSON.parse(oldRow.data):null}catch{}
  const next=structuredClone(item);next.src=await materializeImage(bucket,next.src,"gallery",next.id||"image");
  try{await db.prepare(`INSERT INTO cms_gallery (id,data,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, created_at=excluded.created_at, updated_at=excluded.updated_at`).bind(String(next.id),JSON.stringify(next),String(next.createdAt||new Date().toISOString()),Date.now()).run()}catch(error){if(next.src!==item.src)await deleteManagedImage(bucket,next.src).catch(()=>undefined);throw error}
  // Database commit has succeeded. Failure to delete old media must never turn this write into a false failure.
  if(old?.src&&old.src!==next.src)await deleteManagedImage(bucket,old.src).catch(error=>console.warn("[Gallery cleanup] old R2 object could not be deleted",error));
  return next;
}
export async function deleteGallery(db,bucket,id){
  const row=await db.prepare("SELECT data FROM cms_gallery WHERE id=?").bind(String(id)).first();let item=null;try{item=row?.data?JSON.parse(row.data):null}catch{}
  await db.prepare("DELETE FROM cms_gallery WHERE id=?").bind(String(id)).run();
  // DB deletion is authoritative; orphan cleanup can be retried later without reporting a false DB failure.
  if(item?.src)await deleteManagedImage(bucket,item.src).catch(error=>console.warn("[Gallery cleanup] deleted row but could not delete R2 object",error));
}
