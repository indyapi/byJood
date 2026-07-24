import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET() {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("scheduled_posts")
    .select("*")
    .order("scheduled_at", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request) {
  const admin = createAdminSupabase();
  const body = await request.json();
  const { page_id, platform, content, scheduled_at } = body;

  if (!page_id || !platform || !content || !scheduled_at) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("scheduled_posts")
    .insert({
      page_id,
      platform,
      content,
      scheduled_at,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
