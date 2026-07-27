import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("scheduled_posts")
    .select("*, page:page_id(display_name)")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const body = await request.json();
  const { page_id, platform, content, scheduled_at, media_urls } = body;

  if (!page_id || !platform || !content || !scheduled_at) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const insertData = { page_id, platform, content, scheduled_at, user_id: user.id, status: "pending" };
  if (media_urls?.length > 0) insertData.media_urls = media_urls;

  const { data, error } = await admin
    .from("scheduled_posts")
    .insert(insertData)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
