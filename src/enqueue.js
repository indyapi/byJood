export async function enqueueDuePosts(env) {
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

  const messages = duePosts.map((post) => ({
    body: {
      post_id: post.id,
      page_id: post.page_id,
      platform: post.platform,
      content: post.content,
      media_urls: post.media_urls ?? [],
    },
  }));

  const chunks = chunkArray(messages, 100);
  for (const chunk of chunks) {
    await env.POST_QUEUE.sendBatch(chunk);
  }

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
