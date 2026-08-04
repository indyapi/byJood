/**
 * lib/oauth-configs.js
 * รวม config OAuth ของทุกแพลตฟอร์มไว้ที่เดียว
 * ใช้ทั้งตอน "initiate" (สร้างลิงก์ให้ผู้ใช้กด login) และตอน "callback" (แลก code เป็น token)
 */

const REDIRECT_BASE = process.env.NEXT_PUBLIC_APP_URL; // เช่น https://yourapp.pages.dev

export const OAUTH_CONFIGS = {
  facebook: {
    authUrl: "https://www.facebook.com/v25.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v25.0/oauth/access_token",
    scopes: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
    clientId: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    redirectUri: `${REDIRECT_BASE}/api/auth/facebook/callback`,
  },
  instagram: {
    // IG ธุรกิจผูกกับ Facebook Page จึงใช้ OAuth เดียวกับ Facebook
    authUrl: "https://www.facebook.com/v25.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v25.0/oauth/access_token",
    scopes: ["instagram_basic", "instagram_content_publish", "pages_show_list"],
    clientId: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    redirectUri: `${REDIRECT_BASE}/api/auth/instagram/callback`,
  },
  threads: {
    authUrl: "https://threads.net/oauth/authorize",
    tokenUrl: "https://graph.threads.net/oauth/access_token",
    scopes: ["threads_basic", "threads_content_publish"],
    clientId: process.env.THREADS_APP_ID,
    clientSecret: process.env.THREADS_APP_SECRET,
    redirectUri: `${REDIRECT_BASE}/api/auth/threads/callback`,
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["video.publish", "video.upload"],
    clientId: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    redirectUri: `${REDIRECT_BASE}/api/auth/tiktok/callback`,
  },
};

export function buildAuthUrl(platform, state) {
  const cfg = OAUTH_CONFIGS[platform];
  if (!cfg) throw new Error(`ไม่รองรับแพลตฟอร์ม: ${platform}`);

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: cfg.scopes.join(platform === "tiktok" ? "," : ","),
    response_type: "code",
    state, // ใช้ป้องกัน CSRF และเก็บ user_id
  });

  return `${cfg.authUrl}?${params.toString()}`;
}
