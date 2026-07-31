import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();

  const { data: groups, error } = await admin
    .from("post_groups")
    .select("id, name, scheduled_at, created_at")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const ids = groups.map((g) => g.id);
  const { data: countRows } = await admin
    .from("scheduled_posts")
    .select("group_id, status, media_urls")
    .in("group_id", ids)
    .order("scheduled_at", { ascending: true });

  const cm = {};
  const thumb = {};
  for (const sp of countRows || []) {
    if (!cm[sp.group_id]) cm[sp.group_id] = { total: 0, posted: 0, failed: 0, pending: 0, queued: 0 };
    cm[sp.group_id][sp.status] = (cm[sp.group_id][sp.status] || 0) + 1;
    cm[sp.group_id].total++;
    if (!thumb[sp.group_id] && sp.media_urls?.[0]) thumb[sp.group_id] = sp.media_urls[0];
  }

  const result = groups.map((g) => {
    const c = cm[g.id] || { total: 0, posted: 0, failed: 0, pending: 0, queued: 0 };
    return { ...g, ...c, pending: c.pending + c.queued, thumbnail: thumb[g.id] || null };
  });

  return Response.json(result);
}
