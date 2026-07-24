/**
 * producer.js (= entry point หลักของ Worker)
 * Worker เดียวนี้ทำ 3 หน้าที่:
 *  - scheduled(): cron trigger เข้ามาแตกงาน
 *  - fetch(): endpoint ให้ frontend เรียกโพสต์ทันที
 *  - queue(): consumer ที่ประมวลผลแต่ละ job จริง (import จาก consumer.js)
 */
import { handleQueueBatch } from "./consumer.js";

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(enqueueDuePosts(env));
  },

  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      const result = await enqueueDuePosts(env);
      return Response.json(result);
    }
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname.startsWith("/dashboard")) {
      return Response.redirect(env.PAGES_URL || "https://byjood-next.byjood.workers.dev/dashboard", 302);
    }
    return new Response("Use POST", { status: 405 });
  },

  // Cloudflare เรียกตัวนี้เองเมื่อมี message ใน queue "post-jobs"
  async queue(batch, env, ctx) {
    await handleQueueBatch(batch, env);
  },
};

async function enqueueDuePosts(env) {
  // 1. ดึงโพสต์ที่ถึงเวลาโพสต์ และยังไม่ถูกส่งเข้าคิว (status = 'pending')
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/scheduled_posts?status=eq.pending&scheduled_at=lte.${new Date().toISOString()}&select=*`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!res.ok) {
    return { ok: false, error: `Supabase read failed: ${res.status}` };
  }

  const duePosts = await res.json();
  if (duePosts.length === 0) {
    return { ok: true, enqueued: 0 };
  }

  // 2. ส่งแต่ละโพสต์เข้า Queue เป็น job แยกกัน (fan-out)
  //    แต่ละ message มีแค่ 1 เพจ = 1 platform ไม่รวมกันหลายเพจในงานเดียว
  const messages = duePosts.map((post) => ({
    body: {
      post_id: post.id,
      page_id: post.page_id,
      platform: post.platform, // 'facebook' | 'tiktok' | 'instagram' | 'threads' | 'website'
      content: post.content,
      media_urls: post.media_urls ?? [],
    },
  }));

  // sendBatch รองรับสูงสุด 100 messages ต่อครั้ง — ถ้าเกินให้ chunk เอง
  const chunks = chunkArray(messages, 100);
  for (const chunk of chunks) {
    await env.POST_QUEUE.sendBatch(chunk);
  }

  // 3. mark ว่าโพสต์เหล่านี้เข้าคิวแล้ว กัน cron รอบถัดไปส่งซ้ำ
  const ids = duePosts.map((p) => p.id);
  await fetch(`${env.SUPABASE_URL}/rest/v1/scheduled_posts?id=in.(${ids.join(",")})`, {
    method: "PATCH",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "queued" }),
  });

  return { ok: true, enqueued: messages.length };
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}
