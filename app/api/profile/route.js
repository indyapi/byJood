import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function POST(request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { display_name, username } = await request.json();

  const admin = createAdminSupabase();
  const { data, error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      display_name: display_name ?? user.user_metadata?.display_name ?? null,
      username: username ?? user.user_metadata?.username ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  ).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
