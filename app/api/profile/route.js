import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const profile = data || {};
  return Response.json({
    id: user.id,
    email: user.email,
    auth_provider: profile.auth_provider || user.app_metadata?.provider || null,
    display_name: profile.display_name || user.user_metadata?.display_name || null,
    username: profile.username || user.user_metadata?.username || null,
    avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || null,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  });
}

export async function POST(request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { display_name, username, avatar_url } = await request.json();

  const admin = createAdminSupabase();
  const { data, error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      display_name: display_name ?? user.user_metadata?.display_name ?? null,
      username: username ?? user.user_metadata?.username ?? null,
      avatar_url: avatar_url ?? user.user_metadata?.avatar_url ?? null,
      auth_provider: user.app_metadata?.provider ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  ).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
