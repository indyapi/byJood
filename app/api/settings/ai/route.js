import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

const PROVIDERS = ["gemini", "openai", "claude", "custom"];
const DEFAULT_MODELS = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  claude: "claude-3-5-haiku",
  custom: "gpt-4o-mini",
};

function maskKey(key) {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 6)}••••${key.slice(-4)}`;
}

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("ai_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (!data) {
    return Response.json({
      provider: "gemini",
      model_name: DEFAULT_MODELS.gemini,
      api_key_masked: "",
      base_url: "",
      has_key: false,
      configured: false,
    });
  }

  return Response.json({
    provider: data.provider,
    model_name: data.model_name,
    api_key_masked: maskKey(data.api_key),
    base_url: data.base_url || "",
    has_key: !!data.api_key,
    configured: !!data.api_key,
  });
}

export async function PUT(request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const provider = PROVIDERS.includes(body.provider) ? body.provider : "gemini";
  const model_name = (body.model_name || DEFAULT_MODELS[provider] || "gemini-2.5-flash").trim();
  const base_url = body.base_url ? body.base_url.trim() : null;

  if (!model_name) return Response.json({ error: "Model name is required" }, { status: 400 });

  const admin = createAdminSupabase();

  // Keep the existing key unless the client supplied a new (non-masked) one.
  const { data: existing } = await admin
    .from("ai_settings")
    .select("api_key")
    .eq("user_id", user.id)
    .maybeSingle();

  let apiKey = existing?.api_key || null;
  if (body.api_key && !body.api_key.includes("••") && body.api_key.trim()) {
    apiKey = body.api_key.trim();
  }

  const { data, error } = await admin
    .from("ai_settings")
    .upsert(
      {
        user_id: user.id,
        provider,
        api_key: apiKey,
        base_url,
        model_name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    provider: data.provider,
    model_name: data.model_name,
    api_key_masked: maskKey(data.api_key),
    base_url: data.base_url || "",
    has_key: !!data.api_key,
    configured: !!data.api_key,
  });
}
