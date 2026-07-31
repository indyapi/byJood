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
  const { page_ids, content, scheduled_at, media_urls } = body;

  if (!page_ids?.length || !content || !scheduled_at) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const groupName = content.split("\n")[0].slice(0, 50).trim() || content.slice(0, 50);

  const { data: group, error: groupErr } = await admin
    .from("post_groups")
    .insert({ user_id: user.id, name: groupName, scheduled_at })
    .select()
    .single();

  if (groupErr) return Response.json({ error: groupErr.message }, { status: 500 });

  const { data: pageRows } = await admin
    .from("pages")
    .select("id, platform")
    .in("id", page_ids)
    .eq("user_id", user.id);

  const platFromId = Object.fromEntries((pageRows || []).map((p) => [p.id, p.platform]));

  const posts = [];
  for (const pageId of page_ids) {
    const platform = platFromId[pageId];
    if (!platform) continue;

    const insertData = {
      page_id: pageId,
      platform,
      content,
      scheduled_at,
      user_id: user.id,
      status: "pending",
      group_id: group.id,
    };
    if (media_urls?.length > 0) insertData.media_urls = media_urls;

    const { data: post, error: postErr } = await admin
      .from("scheduled_posts")
      .insert(insertData)
      .select("*, page:page_id(display_name)")
      .single();

    if (postErr) continue;
    posts.push(post);
  }

  return Response.json({ group: { ...group, thumbnail: media_urls?.[0] || null }, posts }, { status: 201 });
}
