import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { callProvider, DEFAULT_MODELS } from "@/lib/ai-providers";

const PROVIDERS = ["gemini", "openai", "claude", "custom"];

export async function POST(request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const admin = createAdminSupabase();
  const { data: saved } = await admin
    .from("ai_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const provider = PROVIDERS.includes(body.provider) ? body.provider : saved?.provider || "gemini";
  const model = (body.model_name || "").trim() || saved?.model_name || DEFAULT_MODELS[provider];
  const baseUrl = (body.base_url || "").trim() || saved?.base_url || null;

  let apiKey = (body.api_key || "").trim();
  if (!apiKey || apiKey.includes("••")) apiKey = saved?.api_key || "";

  if (!apiKey) {
    return Response.json({ ok: false, error: "API key is not configured" }, { status: 400 });
  }

  try {
    await callProvider({
      provider,
      apiKey,
      baseUrl,
      model,
      system: "Reply with exactly: OK",
      user: "ping",
      maxTokens: 16,
    });
    return Response.json({ ok: true, provider, model });
  } catch (e) {
    return Response.json({ ok: false, error: e.message || "Connection failed" }, { status: 200 });
  }
}
