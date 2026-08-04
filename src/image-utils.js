/**
 * image-utils.js
 * Worker-side image conversion to JPEG using Cloudflare's built-in Image
 * Resizing API (the `cf.image` option on fetch). No native/WASM deps needed,
 * works on *.workers.dev, and is the officially supported path for Workers.
 *
 * Flow:
 *   1. Download the source image buffer via fetch(..., { cf: { image: ... } })
 *   2. Cloudflare re-encodes it to high-quality JPEG at the edge
 *   3. Upload the JPEG bytes to Supabase Storage (public bucket) so the Meta
 *      API can fetch the result over a public HTTPS URL
 */

const CONVERTED_BUCKET = "post-images";
const JPEG_QUALITY = 92;

export function needsJpegConversion(imageUrl) {
  const ext = getPathExtension(imageUrl);
  return !["jpg", "jpeg"].includes(ext);
}

function getPathExtension(imageUrl) {
  try {
    const pathname = new URL(imageUrl).pathname;
    const base = pathname.split("/").pop() || "";
    const dot = base.lastIndexOf(".");
    return dot === -1 || dot === 0 ? "" : base.slice(dot + 1).toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Download an image, transcode it to JPEG (quality 92) via Cloudflare Image
 * Resizing, and upload the result to the public `post-images` bucket.
 *
 * Returns { ok, url, error } where `url` is the public HTTPS URL of the
 * converted image.
 */
export async function convertImageToJpeg(imageUrl, env) {
  let res;
  try {
    res = await fetch(imageUrl, {
      headers: { Accept: "image/avif,image/webp,image/jpeg,image/png,*/*" },
      cf: { image: { format: "jpeg", quality: JPEG_QUALITY, fit: "scale-down" } },
    });
  } catch (err) {
    return { ok: false, error: `Failed to fetch source image for conversion: ${String(err)}` };
  }

  if (!res.ok) {
    return { ok: false, error: `Failed to fetch source image for conversion (HTTP ${res.status})` };
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const isJpeg = contentType === "image/jpeg" || contentType.startsWith("image/jpg");
  const bytes = await res.arrayBuffer().catch(() => null);

  if (!isJpeg || !bytes || bytes.byteLength === 0) {
    return {
      ok: false,
      error: `Conversion produced "${contentType || "unknown content-type"}" (expected image/jpeg). Cloudflare Image Resizing may not be enabled for this account.`,
    };
  }

  const name = `converted/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const uploadRes = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${CONVERTED_BUCKET}/${name}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "true",
    },
    body: bytes,
  });

  if (!uploadRes.ok) {
    const detail = await uploadRes.text().catch(() => "");
    return { ok: false, error: `Failed to upload converted image to storage (HTTP ${uploadRes.status}) ${detail}` };
  }

  return { ok: true, url: `${env.SUPABASE_URL}/storage/v1/object/public/${CONVERTED_BUCKET}/${name}` };
}
