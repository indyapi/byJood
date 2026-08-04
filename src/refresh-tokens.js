/**
 * refresh-tokens.js
 * Worker แยกต่างหาก (deploy คนละตัวจาก social-poster) รันทุกวันเพื่อ refresh
 * token ที่ใกล้หมดอายุใน 3 วันข้างหน้า จะได้ไม่มีเพจไหนโพสต์พังกลางทาง
 *
 * wrangler.toml ของตัวนี้ควรมี:
 * [triggers]
 * crons = ["0 3 * * *"]   # ทุกวันตี 3
 */

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshExpiringTokens(env));
  },
};

export async function refreshExpiringTokens(env) {
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/page_tokens?expires_at=lte.${threeDaysFromNow}&refresh_token=not.is.null&select=*`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const expiring = await res.json();

  for (const row of expiring) {
    try {
      const refreshed = await refreshToken(row.platform, row.refresh_token, env);
      if (refreshed.access_token) {
        const update = {
          refresh_token: refreshed.refresh_token ?? row.refresh_token,
          expires_at: refreshed.expires_in
            ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
            : row.expires_at,
          updated_at: new Date().toISOString(),
        };
        // Facebook/Instagram page tokens never expire when fetched via long-lived user token.
        // Only update the long-lived user token (refresh_token) and its expiry.
        if (row.platform !== "facebook" && row.platform !== "instagram") {
          update.access_token = refreshed.access_token;
        }
        await fetch(`${env.SUPABASE_URL}/rest/v1/page_tokens?id=eq.${row.id}`, {
          method: "PATCH",
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(update),
        });
      }
    } catch (err) {
      // ไม่ throw เพราะไม่อยากให้ token 1 ตัวพังแล้วหยุดทั้ง batch
      console.error(`Refresh failed for page_token ${row.id}:`, err);
    }
  }

  return { refreshed: expiring.length };
}

async function refreshToken(platform, refreshToken, env) {
  if (platform === "facebook" || platform === "instagram") {
    // FB long-lived token ต้อง exchange ใหม่ด้วย fb_exchange_token grant
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      fb_exchange_token: refreshToken,
    });
    const res = await fetch(`https://graph.facebook.com/v25.0/oauth/access_token?${params}`);
    return res.json();
  }

  if (platform === "tiktok") {
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY,
        client_secret: env.TIKTOK_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    return res.json();
  }

  if (platform === "threads") {
    const res = await fetch(
      `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${refreshToken}`
    );
    return res.json();
  }

  return {};
}
