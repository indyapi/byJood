import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { callProvider, AI_SYSTEM_PROMPT, buildAiUserPrompt } from "@/lib/ai-providers";

export async function POST(request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { prompt, action_type, current_content } = body;
  const actionType = ["improve", "hashtags", "shorten", "engaging"].includes(action_type)
    ? action_type
    : "improve";

  const admin = createAdminSupabase();
  const { data: settings } = await admin
    .from("ai_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.api_key) {
    return Response.json(
      { error: "AI is not configured. Add an API key in Profile > AI Content Assistant Settings." },
      { status: 400 }
    );
  }

  try {
    const { text } = await callProvider({
      provider: settings.provider,
      apiKey: settings.api_key,
      baseUrl: settings.base_url,
      model: settings.model_name,
      system: AI_SYSTEM_PROMPT,
      user: buildAiUserPrompt(actionType, current_content || "", prompt || ""),
      maxTokens: 1200,
    });
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: e.message || "AI request failed" }, { status: 502 });
  }
}
