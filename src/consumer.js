import { PLATFORM_HANDLERS } from "./platforms.js";

/**
 * consumer.js
 * ทำงานทีละ message จาก Queue — แต่ละ message = 1 เพจ/1 แพลตฟอร์ม
 * ถ้า fail จะ retry อัตโนมัติตาม max_retries ใน wrangler.toml (ไม่กระทบ job อื่น)
 */
export async function handleQueueBatch(batch, env) {
  for (const message of batch.messages) {
    const job = message.body;
    try {
      const result = await processJob(job, env);
      await logResult(env, job, result);

      if (result.success) {
        message.ack();
      } else {
        // fail แบบ known error (เช่น token หมดอายุ) -> retry ตาม policy
        message.retry();
      }
    } catch (err) {
      await logResult(env, job, { success: false, error: String(err) });
      message.retry();
    }
  }
}

async function processJob(job, env) {
  // 1. ดึง external_page_id ที่แท้จริงของเพจนี้ (ไม่ใช่ UUID ภายใน)
  const pageRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/pages?id=eq.${job.page_id}&select=external_page_id`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const [pageRow] = await pageRes.json();
  if (!pageRow) {
    return { success: false, error: "ไม่พบเพจนี้" };
  }

  // 2. ดึง access token ล่าสุดของเพจนี้จาก Supabase (เผื่อมีการ refresh token ไปแล้ว)
  const tokenRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/page_tokens?page_id=eq.${job.page_id}&platform=eq.${job.platform}&select=access_token,webhook_url`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const [tokenRow] = await tokenRes.json();
  if (!tokenRow) {
    return { success: false, error: "ไม่พบ token สำหรับเพจนี้" };
  }

  const handler = PLATFORM_HANDLERS[job.platform];
  if (!handler) {
    return { success: false, error: `ไม่รองรับแพลตฟอร์ม: ${job.platform}` };
  }

  return handler(
    { ...job, access_token: tokenRow.access_token, webhook_url: tokenRow.webhook_url, page_id: pageRow.external_page_id },
    env
  );
}

async function logResult(env, job, result) {
  await fetch(`${env.SUPABASE_URL}/rest/v1/post_logs`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      post_id: job.post_id,
      page_id: job.page_id,
      platform: job.platform,
      success: result.success,
      external_post_id: result.externalPostId ?? null,
      error_message: result.error ?? null,
      error_code: result.errorCode ?? null,
      error_type: result.errorType ?? null,
      error_subcode: result.errorSubcode ?? null,
      created_at: new Date().toISOString(),
    }),
  });

  // อัปเดตสถานะโพสต์หลักด้วย ถ้าสำเร็จ
  if (result.success) {
    const patchBody = { status: "posted" };
    if (result.externalPostId) patchBody.external_post_id = result.externalPostId;
    await fetch(`${env.SUPABASE_URL}/rest/v1/scheduled_posts?id=eq.${job.post_id}`, {
      method: "PATCH",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchBody),
    });
  }
}
