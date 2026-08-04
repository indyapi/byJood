/**
 * platforms.js
 * แต่ละฟังก์ชันรับ (job, env) แล้วคืนค่า { success, externalPostId, error }
 * job.access_token ควรถูกดึงมาจาก Supabase ก่อนเรียก (ดู consumer.js)
 */

import { convertImageToJpeg, needsJpegConversion } from "./image-utils.js";

// Permissions ที่ Facebook Page Access Token ต้องมีจึงจะโพสต์และอ่าน engagement ได้
const REQUIRED_FB_PERMS = ["pages_manage_posts", "pages_read_engagement"];

/**
 * ตรวจสอบว่า Page Access Token มีสิทธิ์ตามที่ต้องการหรือไม่
 * ถ้าตรวจสอบไม่ได้ (network error / API error) จะไม่บล็อกการโพสต์
 */
async function checkFacebookPermissions(page_id, access_token) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/${page_id}?fields=perms&access_token=${encodeURIComponent(access_token)}`
    );
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.perms)) {
      return { ok: true, missing: [] };
    }
    const missing = REQUIRED_FB_PERMS.filter((p) => !data.perms.includes(p));
    return { ok: missing.length === 0, missing };
  } catch {
    return { ok: true, missing: [] };
  }
}

export async function postToFacebook(job) {
  const { page_id, content, media_urls, access_token } = job;

  // 3. ตรวจสอบสิทธิ์ของ Page Access Token ก่อนโพสต์ทุกครั้ง
  const permCheck = await checkFacebookPermissions(page_id, access_token);
  if (!permCheck.ok) {
    return {
      success: false,
      error: `Facebook token ขาด permission: ${permCheck.missing.join(", ")}`,
    };
  }

  if (media_urls?.length === 0) {
    const res = await fetch(`https://graph.facebook.com/v25.0/${page_id}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, access_token, published: true }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message ?? "Unknown FB error" };
    return { success: true, externalPostId: data.id };
  }

  // 1. โพสต์ข้อความ + รูปเดียว: ส่งไปที่ /photos พร้อม published: true
  //    และห้ามใส่ no_story: true (ไม่งั้นรูปจะถูกอัปโหลดแต่ไม่ขึ้น Feed)
  if (media_urls.length === 1) {
    const res = await fetch(`https://graph.facebook.com/v25.0/${page_id}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: media_urls[0],
        message: content,
        access_token,
        published: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message ?? "Unknown FB error" };
    return { success: true, externalPostId: data.id };
  }

  // 2. โพสต์หลายรูป: Step 1 อัปโหลดรูปแบบ unpublished เพื่อเก็บ photo_id
  //    ใช้ Promise.all โดย map ผลลัพธ์กลับไปที่ index เดิมของ media_urls เพื่อคงลำดับรูป
  const uploads = media_urls.map((url, index) =>
    fetch(`https://graph.facebook.com/v25.0/${page_id}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, access_token, published: false }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          return { index, ok: false, error: data.error?.message ?? "Unknown FB upload error" };
        }
        return { index, ok: true, id: data.id };
      })
      .catch(() => ({ index, ok: false, error: "Network error while uploading photo" }))
  );

  const results = await Promise.all(uploads);
  const failed = results.find((r) => !r.ok);
  if (failed) {
    return { success: false, error: `อัปโหลดรูปไม่สำเร็จ: ${failed.error}` };
  }

  // เรียง photo_id ตาม index เดิมของ media_urls (รูปที่ 1 = cover)
  const orderedPhotoIds = results
    .sort((a, b) => a.index - b.index)
    .map((r) => r.id);

  // 2. Step 2 สร้าง Feed Post โดยแนบ attached_media ตามลำดับที่ผู้ใช้จัดไว้ แล้วเผยแพร่
  const attachedMedia = orderedPhotoIds.map((media_fbid) => ({ media_fbid }));

  const feedRes = await fetch(`https://graph.facebook.com/v25.0/${page_id}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: content,
      access_token,
      published: true,
      attached_media: attachedMedia,
    }),
  });
  const feedData = await feedRes.json();
  if (!feedRes.ok) return { success: false, error: feedData.error?.message ?? "Unknown FB error" };
  return { success: true, externalPostId: feedData.id };
}

// ---------- Instagram helpers ----------

const IG_VIDEO_EXT = new Set(["mp4", "mov", "m4v", "avi", "webm", "mkv", "3gp", "wmv", "flv"]);

function getPathExtension(pathname) {
  const base = pathname.split("/").pop() || "";
  const dot = base.lastIndexOf(".");
  return dot === -1 || dot === 0 ? "" : base.slice(dot + 1).toLowerCase();
}

function isPrivateHostname(hostname) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "0.0.0.0" || h === "::" || h === "::1") return true;
  return /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
}

/**
 * Validate that media_urls[0] is a public HTTPS image URL that the Meta API
 * can fetch (no localhost / private host / blob / data, and not a video).
 * Non-JPEG formats are NOT rejected here — they are converted by the image
 * utility in postToInstagram.
 */
function validateInstagramImage(mediaUrls) {
  const url = Array.isArray(mediaUrls) ? mediaUrls[0] : null;
  if (!url || typeof url !== "string" || !url.trim()) {
    return { ok: false, error: "Instagram requires at least 1 image" };
  }

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { ok: false, error: `Instagram image URL is not a valid URL: "${url}"` };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: `Instagram image URL must be a public HTTPS URL (got "${parsed.protocol}//")` };
  }
  if (isPrivateHostname(parsed.hostname)) {
    return { ok: false, error: `Instagram image URL must be publicly accessible (got host "${parsed.hostname}")` };
  }

  const ext = getPathExtension(parsed.pathname);
  if (IG_VIDEO_EXT.has(ext)) {
    return { ok: false, error: `Instagram image_url only accepts images — got a video file (.${ext}). Video posting is not supported yet.` };
  }

  return { ok: true, url: url.trim() };
}

/**
 * Best-effort HEAD check that the image URL is publicly reachable.
 * Only fails on definitive signals (4xx/5xx, HTML page, video/audio);
 * network timeouts are inconclusive so they don't block posting.
 */
async function checkImageAccessible(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (res.status >= 400 && res.status !== 405) {
      return { ok: false, error: `Instagram image URL is not publicly accessible (HTTP ${res.status}) — check the link or re-upload.` };
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.startsWith("text/")) {
      return { ok: false, error: `Instagram image URL returned an HTML page (${ct}) — the link is not a direct image file.` };
    }
    if (/^(video|audio)\//.test(ct)) {
      return { ok: false, error: `Instagram image URL points to ${ct} — expected an image (JPEG/JPG or PNG).` };
    }
  } catch {
    // Inconclusive — Meta may still be able to fetch it, so don't block.
  }
  return { ok: true };
}

/** Build a human-readable Meta API error string for the Logs UI. */
function extractMetaError(data, fallback) {
  const err = data?.error;
  if (!err) return fallback ?? data?.message ?? "Unknown Meta API error";
  const parts = [];
  if (err.error_user_title) parts.push(err.error_user_title);
  if (err.error_user_msg) parts.push(err.error_user_msg);
  if (err.message) parts.push(err.message);
  if (err.type) parts.push(`type: ${err.type}`);
  if (err.code) parts.push(`code: ${err.code}`);
  if (err.error_subcode) parts.push(`subcode: ${err.error_subcode}`);
  if (err.fbtrace_id) parts.push(`trace: ${err.fbtrace_id}`);
  return parts.join(" — ");
}

/** Structured Meta error fields, persisted so the Logs UI / queries can filter on them. */
function extractMetaErrorFields(data) {
  return {
    errorCode: data?.error?.code != null ? String(data.error.code) : null,
    errorType: data?.error?.type ?? null,
    errorSubcode: data?.error?.error_subcode != null ? String(data.error.error_subcode) : null,
  };
}

/**
 * Threads error diagnostics. The Threads API returns the same Meta-style error
 * envelope; when the account/node cannot be found ("The requested resource does
 * not exist") it is almost always a wrong Threads User ID, a bad token, or a
 * missing threads_content_publish permission — so append actionable guidance.
 */
function extractThreadsError(data, fallback) {
  const base = extractMetaError(data, fallback);
  const msg = data?.error?.message || "";
  if (/requested resource does not exist/i.test(msg)) {
    return `${base} — Please check the Threads User ID (external_page_id) and the access token. Verify that the threads_content_publish permission has been granted.`;
  }
  return base;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll the media container until it reaches FINISHED (large images take time).
 * Publishes only once the container is ready, otherwise returns the failure.
 */
async function waitForContainerStatus(containerId, accessToken, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = null;
  while (Date.now() < deadline) {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`
    );
    const data = await res.json();
    if (data?.error) {
      return { ok: false, status: null, error: extractMetaError(data, "Unknown error while checking media container status") };
    }
    lastStatus = data?.status_code || data?.status || null;
    if (lastStatus === "FINISHED") return { ok: true, status: lastStatus };
    if (["ERROR", "EXPIRED", "FAILED"].includes(lastStatus)) {
      return { ok: false, status: lastStatus, error: `Media container ${lastStatus}: ${data?.status_detail || "unknown reason"}` };
    }
    await sleep(3000);
  }
  return { ok: false, status: lastStatus, error: `Media container did not reach FINISHED within ${timeoutMs / 1000}s (last status: ${lastStatus || "unknown"})` };
}

/**
 * Threads-specific container poller. Threads runs on graph.threads.net (v1.0),
 * so it cannot reuse the Facebook poller above. Polls until FINISHED.
 */
async function waitForThreadsContainerStatus(containerId, accessToken, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = null;
  while (Date.now() < deadline) {
    const res = await fetch(
      `https://graph.threads.net/v1.0/${containerId}?fields=status,status_detail&access_token=${encodeURIComponent(accessToken)}`
    );
    const data = await res.json();
    if (data?.error) {
      return { ok: false, status: null, error: extractThreadsError(data, "Unknown error while checking Threads container status") };
    }
    lastStatus = data?.status || null;
    if (lastStatus === "FINISHED") return { ok: true, status: lastStatus };
    if (["ERROR", "EXPIRED", "FAILED"].includes(lastStatus)) {
      return { ok: false, status: lastStatus, error: `Threads container ${lastStatus}: ${data?.status_detail || "unknown reason"}` };
    }
    await sleep(3000);
  }
  return { ok: false, status: lastStatus, error: `Threads container did not reach FINISHED within ${timeoutMs / 1000}s (last status: ${lastStatus || "unknown"})` };
}

export async function postToInstagram(job, env) {
  const { page_id, content, media_urls, access_token, ig_business_account_id } = job;

  // The IG Graph API posts to the IG Business Account node. Prefer the
  // dedicated column, fall back to external_page_id for legacy rows.
  const igTargetId = ig_business_account_id || page_id;
  if (!igTargetId) {
    return { success: false, error: "Missing Instagram Business Account ID" };
  }

  // 1. Validate the image URL/format before hitting the API
  const imageCheck = validateInstagramImage(media_urls);
  if (!imageCheck.ok) return { success: false, error: imageCheck.error };

  const accessible = await checkImageAccessible(imageCheck.url);
  if (!accessible.ok) return { success: false, error: accessible.error };

  // 1.5 Instagram image_url effectively accepts JPEG/JPG, so transcode any
  //     other format (PNG/WebP/HEIC/BMP/...) to high-quality JPEG first.
  let imageUrl = imageCheck.url;
  if (needsJpegConversion(imageUrl)) {
    const converted = await convertImageToJpeg(imageUrl, env);
    if (converted.ok) {
      imageUrl = converted.url;
      console.log(`[Image Utility] Successfully converted image to JPEG for Instagram: ${imageCheck.url} -> ${imageUrl}`);
    } else {
      // Fallback: keep the original URL and let Meta decide, but report loudly.
      console.error(`[Image Utility] Conversion failed — falling back to original URL. ${converted.error}`);
    }
  }

  // 2. Step 1 — create the media container
  let containerRes, container;
  try {
    containerRes = await fetch(
      `https://graph.facebook.com/v25.0/${igTargetId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: content,
          access_token,
        }),
      }
    );
    container = await containerRes.json();
  } catch (err) {
    return { success: false, error: `Network error creating Instagram media container: ${String(err)}` };
  }
  if (!containerRes.ok || !container.id) {
    return {
      success: false,
      error: extractMetaError(container, "Unknown error creating Instagram media container"),
      ...extractMetaErrorFields(container),
    };
  }

  // 3. Wait for the container to finish processing before publishing
  const status = await waitForContainerStatus(container.id, access_token);
  if (!status.ok) {
    return { success: false, error: status.error };
  }

  // 4. Step 2 — publish the finished container
  let publishRes, publish;
  try {
    publishRes = await fetch(
      `https://graph.facebook.com/v25.0/${igTargetId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: container.id, access_token }),
      }
    );
    publish = await publishRes.json();
  } catch (err) {
    return { success: false, error: `Network error publishing Instagram media: ${String(err)}` };
  }
  if (!publishRes.ok || !publish.id) {
    return {
      success: false,
      error: extractMetaError(publish, "Unknown error publishing Instagram media"),
      ...extractMetaErrorFields(publish),
    };
  }

  return { success: true, externalPostId: publish.id };
}

export async function postToTikTok(job) {
  // TikTok Content Posting API: ต้อง init upload ก่อน แล้ว query status (async)
  const { content, media_urls, access_token } = job;
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: { title: content, privacy_level: "PUBLIC_TO_EVERYONE" },
      source_info: { source: "PULL_FROM_URL", video_url: media_urls?.[0] },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error?.code !== "ok") {
    return { success: false, error: data.error?.message ?? "TikTok init failed" };
  }
  // หมายเหตุ: TikTok เป็น async, publish_id นี้ต้องเช็คสถานะภายหลังผ่าน endpoint แยก
  return { success: true, externalPostId: data.data?.publish_id };
}

export async function postToThreads(job, env) {
  const { page_id, content, media_urls, access_token } = job;

  // Step 1 — Threads posts to the Threads User ID node (external_page_id).
  const threadsUserId = page_id;
  if (!threadsUserId) {
    return { success: false, error: "Missing Threads User ID (external_page_id) — กรุณาเพิ่ม Threads User ID ใน Manage Pages" };
  }
  if (!access_token) {
    return { success: false, error: "Missing Threads access token (page_tokens.access_token) — กรุณาแก้ไข connection ใน Manage Pages" };
  }

  // Step 2 — media type: IMAGE when an image is attached (Threads supports
  // one image), otherwise a pure TEXT thread (unlike Instagram).
  const imageUrl = Array.isArray(media_urls) && media_urls[0] ? media_urls[0].trim() : null;
  if (imageUrl) {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol !== "https:") {
        return { success: false, error: `Threads image URL must be an HTTPS URL (got "${parsed.protocol}//")` };
      }
    } catch {
      return { success: false, error: `Threads image URL is not a valid URL: "${imageUrl}"` };
    }
  }
  const mediaType = imageUrl ? "IMAGE" : "TEXT";

  // Step 3 — create the container
  let containerRes, container;
  try {
    containerRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: mediaType,
          text: content,
          ...(imageUrl ? { image_url: imageUrl } : {}),
          access_token,
        }),
      }
    );
    container = await containerRes.json();
  } catch (err) {
    return { success: false, error: `Network error creating Threads container: ${String(err)}` };
  }
  if (!containerRes.ok || !container.id) {
    return {
      success: false,
      error: extractThreadsError(container, "Unknown error creating Threads container"),
      ...extractMetaErrorFields(container),
    };
  }
  const creationId = container.id;

  // Step 4 — poll the container until it is ready to publish
  const status = await waitForThreadsContainerStatus(creationId, access_token);
  if (!status.ok) {
    return { success: false, error: status.error };
  }

  // Step 5 — publish the finished container
  let publishRes, publish;
  try {
    publishRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: creationId, access_token }),
      }
    );
    publish = await publishRes.json();
  } catch (err) {
    return { success: false, error: `Network error publishing Threads: ${String(err)}` };
  }
  if (!publishRes.ok || !publish.id) {
    return {
      success: false,
      error: extractThreadsError(publish, "Unknown error publishing Threads"),
      ...extractMetaErrorFields(publish),
    };
  }

  return { success: true, externalPostId: publish.id };
}

export async function postToWebsite(job, env) {
  // เช่น ยิงเข้า Webhook ของเว็บตัวเอง หรือ WordPress REST API
  const res = await fetch(job.webhook_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: job.content, media_urls: job.media_urls }),
  });
  if (!res.ok) return { success: false, error: `Website webhook failed: ${res.status}` };
  const data = await res.json().catch(() => ({}));
  return { success: true, externalPostId: data.id ?? null };
}

export const PLATFORM_HANDLERS = {
  facebook: postToFacebook,
  instagram: postToInstagram,
  tiktok: postToTikTok,
  threads: postToThreads,
  website: postToWebsite,
};
