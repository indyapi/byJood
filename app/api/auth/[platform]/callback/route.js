// app/api/auth/[platform]/callback/route.js
// แพลตฟอร์ม redirect กลับมาที่นี่พร้อม ?code=...&state=...

import { OAUTH_CONFIGS } from "@/lib/oauth-configs";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(request, { params }) {
  const { platform } = params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return Response.json({ error: "Missing code or state" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // 1. ตรวจ state ว่าถูกสร้างโดยระบบเราจริง (กัน CSRF)
  const { data: stateRow } = await supabase
    .from("oauth_states")
    .select("user_id")
    .eq("state", state)
    .eq("platform", platform)
    .single();

  if (!stateRow) {
    return Response.json({ error: "Invalid or expired state" }, { status: 400 });
  }
  await supabase.from("oauth_states").delete().eq("state", state); // ใช้ครั้งเดียวทิ้ง

  // 2. แลก code เป็น access token
  const cfg = OAUTH_CONFIGS[platform];
  let tokenData = await exchangeCodeForToken(platform, cfg, code);
  if (tokenData.error) {
    return Response.json({ error: tokenData.error }, { status: 400 });
  }

  let accessToken = tokenData.access_token;
  let expiresIn = tokenData.expires_in;

  // 2.5 Exchange short-lived → long-lived (60 day) token for Facebook/Instagram
  if (platform === "facebook" || platform === "instagram") {
    const exchangeUrl = `https://graph.facebook.com/v25.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${cfg.clientId}` +
      `&client_secret=${cfg.clientSecret}` +
      `&fb_exchange_token=${accessToken}`;
    const exchangeRes = await fetch(exchangeUrl);
    const exchangeData = await exchangeRes.json();
    if (exchangeData.access_token) {
      accessToken = exchangeData.access_token;
      expiresIn = exchangeData.expires_in;
    }
  }

  // 3. ดึงรายชื่อเพจ/บัญชีที่ user คนนี้ manage อยู่ (แต่ละแพลตฟอร์มมี endpoint ต่างกัน)
  const accounts = await fetchManagedAccounts(platform, accessToken);

  // 4. บันทึกลง Supabase: 1 บัญชี = 1 แถวใน pages + page_tokens
  for (const account of accounts) {
    const { data: page } = await supabase
      .from("pages")
      .upsert(
        {
          user_id: stateRow.user_id,
          platform,
          external_page_id: account.id,
          display_name: account.name,
        },
        { onConflict: "user_id,platform,external_page_id" }
      )
      .select()
      .single();

    await supabase.from("page_tokens").upsert(
      {
        page_id: page.id,
        platform,
        access_token: account.access_token ?? accessToken,
        refresh_token: (platform === "facebook" || platform === "instagram")
          ? accessToken
          : (tokenData.refresh_token ?? null),
        expires_at: expiresIn
          ? new Date(Date.now() + expiresIn * 1000).toISOString()
          : null,
      },
      { onConflict: "page_id,platform" }
    );
  }

  return Response.redirect(new URL("/dashboard?connected=" + platform, request.url));
}

async function exchangeCodeForToken(platform, cfg, code) {
  if (platform === "tiktok") {
    const res = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: cfg.redirectUri,
      }),
    });
    return res.json();
  }

  // Facebook / Instagram / Threads ใช้รูปแบบ query param คล้ายกัน
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    code,
    redirect_uri: cfg.redirectUri,
  });
  const res = await fetch(`${cfg.tokenUrl}?${params.toString()}`);
  return res.json();
}

async function fetchManagedAccounts(platform, accessToken) {
  if (platform === "facebook") {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?access_token=${accessToken}`
    );
    const data = await res.json();
    // แต่ละเพจมี access_token เฉพาะเพจนั้น (Page Access Token) ต่างจาก user token
    return (data.data ?? []).map((p) => ({ id: p.id, name: p.name, access_token: p.access_token }));
  }

  if (platform === "instagram") {
    // ต้องผ่าน Facebook Page ก่อน แล้วดึง instagram_business_account ที่ผูกอยู่
    const pagesRes = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?fields=instagram_business_account,access_token&access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();
    return (pagesData.data ?? [])
      .filter((p) => p.instagram_business_account)
      .map((p) => ({
        id: p.instagram_business_account.id,
        name: p.name,
        access_token: p.access_token,
      }));
  }

  if (platform === "threads") {
    const res = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${accessToken}`
    );
    const data = await res.json();
    return [{ id: data.id, name: data.username, access_token: accessToken }];
  }

  if (platform === "tiktok") {
    const res = await fetch("https://open.tiktokapis.com/v2/user/info/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return [{ id: data.data.user.open_id, name: data.data.user.display_name, access_token: accessToken }];
  }

  return [];
}
