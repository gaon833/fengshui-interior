export async function onRequestGet(context) {
  if (!context.env.PROJECT_MEDIA) return new Response("R2 binding PROJECT_MEDIA is unavailable.", { status: 503 });
  const key = String(context.params.key || "");
  if (!key) return new Response("Not found", { status: 404 });
  const object = await context.env.PROJECT_MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
