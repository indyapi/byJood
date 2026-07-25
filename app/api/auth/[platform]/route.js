// app/api/auth/[platform]/route.js
// ผู้ใช้กดปุ่ม "เชื่อมต่อ Facebook" → มาที่ route นี้ → redirect ไปหน้า login ของ FB

import { buildAuthUrl } from "@/lib/oauth-configs";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(request, { params }) {
  const { platform } = params;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.redirect(new URL("/login", request.url));
  }

  // state = user_id + random nonce เข้ารหัสง่ายๆ กัน CSRF และรู้ว่า callback เป็นของใคร
  const state = Buffer.from(
    JSON.stringify({ userId: user.id, nonce: crypto.randomUUID() })
  ).toString("base64url");

  // เก็บ state ไว้เช็คตอน callback (กัน third-party ปลอม callback)
  await supabase.from("oauth_states").insert({ state, user_id: user.id, platform });

  const authUrl = buildAuthUrl(platform, state);
  return Response.redirect(authUrl);
}
