/**
 * platforms.js
 * แต่ละฟังก์ชันรับ (job, env) แล้วคืนค่า { success, externalPostId, error }
 * job.access_token ควรถูกดึงมาจาก Supabase ก่อนเรียก (ดู consumer.js)
 */

export async function postToFacebook(job) {
  const { page_id, content, media_urls, access_token } = job;
  const url = `https://graph.facebook.com/v21.0/${page_id}/feed`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: content,
      access_token,
      // ถ้ามีรูป ควรใช้ /photos endpoint แทน /feed
    }),
  });
  const data = await res.json();
  if (!res.ok) return { success: false, error: data.error?.message ?? "Unknown FB error" };
  return { success: true, externalPostId: data.id };
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
