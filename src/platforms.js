/**
 * platforms.js
 * แต่ละฟังก์ชันรับ (job, env) แล้วคืนค่า { success, externalPostId, error }
 * job.access_token ควรถูกดึงมาจาก Supabase ก่อนเรียก (ดู consumer.js)
 */

// Permissions ที่ Facebook Page Access Token ต้องมีจึงจะโพสต์และอ่าน engagement ได้
const REQUIRED_FB_PERMS = ["pages_manage_posts", "pages_read_engagement"];

/**
 * ตรวจสอบว่า Page Access Token มีสิทธิ์ตามที่ต้องการหรือไม่
 * ถ้าตรวจสอบไม่ได้ (network error / API error) จะไม่บล็อกการโพสต์
 */
async function checkFacebookPermissions(page_id, access_token) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${page_id}?fields=perms&access_token=${encodeURIComponent(access_token)}`
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
    const res = await fetch(`https://graph.facebook.com/v21.0/${page_id}/feed`, {
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
    const res = await fetch(`https://graph.facebook.com/v21.0/${page_id}/photos`, {
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
    fetch(`https://graph.facebook.com/v21.0/${page_id}/photos`, {
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

  const feedRes = await fetch(`https://graph.facebook.com/v21.0/${page_id}/feed`, {
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

export async function postToInstagram(job) {
  // IG Graph API ต้องสร้าง media container ก่อน แล้วค่อย publish (2 ขั้นตอน)
  const { page_id, content, media_urls, access_token } = job;
  if (!media_urls?.length) {
    return { success: false, error: "Instagram ต้องมีรูป/วิดีโออย่างน้อย 1 ไฟล์" };
  }

  const containerRes = await fetch(
    `https://graph.facebook.com/v21.0/${page_id}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: media_urls[0],
        caption: content,
        access_token,
      }),
    }
  );
  const container = await containerRes.json();
  if (!containerRes.ok) return { success: false, error: container.error?.message };

  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${page_id}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: container.id, access_token }),
    }
  );
  const publish = await publishRes.json();
  if (!publishRes.ok) return { success: false, error: publish.error?.message };
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

export async function postToThreads(job) {
  const { page_id, content, access_token } = job;
  const containerRes = await fetch(
    `https://graph.threads.net/v1.0/${page_id}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_type: "TEXT", text: content, access_token }),
    }
  );
  const container = await containerRes.json();
  if (!containerRes.ok) return { success: false, error: container.error?.message };

  const publishRes = await fetch(
    `https://graph.threads.net/v1.0/${page_id}/threads_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: container.id, access_token }),
    }
  );
  const publish = await publishRes.json();
  if (!publishRes.ok) return { success: false, error: publish.error?.message };
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
