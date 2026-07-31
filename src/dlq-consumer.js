/**
 * dlq-consumer.js
 * ทำงานเมื่อ message เกิน max_retries แล้วถูกส่งมาที่ Dead Letter Queue (post-jobs-dlq)
 * อัปเดต scheduled_posts เป็น status='failed' พร้อมบันทึก error_message + failed_at แล้ว ack
 */
export async function handleDlqBatch(batch, env) {
  for (const message of batch.messages) {
    const job = message.body;
    try {
      const errorMessage = await lastError(env, job);
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/scheduled_posts?id=eq.${job.post_id}`,
        {
          method: "PATCH",
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            status: "failed",
            error_message: errorMessage,
            failed_at: new Date().toISOString(),
          }),
        }
      );

      if (!res.ok) {
        message.retry();
        continue;
      }
      message.ack();
    } catch (err) {
      message.retry();
    }
  }
}

// ดึง error ล่าสุดจาก post_logs (ถ้ามี) มาเก็บไว้ที่ scheduled_posts.error_message
async function lastError(env, job) {
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/post_logs?post_id=eq.${job.post_id}&order=created_at.desc&limit=1&select=error_message,success`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const [row] = await res.json();
    if (!row || row.success) return null;
    return row.error_message || null;
  } catch {
    return null;
  }
}
