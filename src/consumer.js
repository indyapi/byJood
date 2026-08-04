import { PLATFORM_HANDLERS, postToThreads } from "./platforms.js";

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
    `${env.SUPABASE_URL}/rest/v1/pages?id=eq.${job.page_id}&select=external_page_id,ig_business_account_id`,
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

  if (job.platform === "threads") return await postToThreads(job, env);

  return handler(
    {
      ...job,
      access_token: tokenRow.access_token,
      webhook_url: tokenRow.webhook_url,
      page_id: pageRow.external_page_id,
      ig_business_account_id: pageRow.ig_business_account_id ?? null,
    },
    env
  );
}

async function logResult(env, job, result) {
  try {
    const base = {
      post_id: job.post_id,
      page_id: job.page_id,
      platform: job.platform,
      success: result.success,
      external_post_id: result.externalPostId ?? null,
      error_message: result.error ?? null,
      created_at: new Date().toISOString(),
    };

    // Write the log row. If the DB doesn't have the structured error columns yet
    // (schema migration not applied), retry once without them so logging and the
    // status update below never silently break.
    let insertRes = await insertLog(env, {
      ...base,
      error_code: result.errorCode ?? null,
      error_type: result.errorType ?? null,
      error_subcode: result.errorSubcode ?? null,
    });
    if (!insertRes.ok) {
      const detail = await insertRes.text().catch(() => "");
      console.error(`[consumer] post_logs insert failed (${insertRes.status}) ${detail} — retrying without structured error fields`);
      insertRes = await insertLog(env, base);
      if (!insertRes.ok) {
        console.error(`[consumer] post_logs insert failed (${insertRes.status}) ${await insertRes.text().catch(() => "")}`);
      }
    }

    // อัปเดตสถานะโพสต์หลักด้วย ถ้าสำเร็จ
    if (result.success) {
      const patchBody = { status: "posted" };
      if (result.externalPostId) patchBody.external_post_id = result.externalPostId;
      const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/scheduled_posts?id=eq.${job.post_id}`, {
        method: "PATCH",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patchBody),
      });
      if (!patchRes.ok) {
        console.error(`[consumer] scheduled_posts PATCH failed (${patchRes.status}) ${await patchRes.text().catch(() => "")}`);
      }
    }
  } catch (err) {
    // Never let logging failures throw — otherwise the queue message would
    // retry forever even after a successful post.
    console.error(`[consumer] logResult failed: ${String(err)}`);
  }
}

async function insertLog(env, body) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/post_logs`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
}
