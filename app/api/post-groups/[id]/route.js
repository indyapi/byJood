import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

async function deleteFromPlatform(platform, externalPostId, accessToken) {
  switch (platform) {
    case "facebook":
    case "instagram": {
      await fetch(`https://graph.facebook.com/v21.0/${externalPostId}?access_token=${accessToken}`, { method: "DELETE" });
      break;
    }
    case "tiktok": {
      await fetch("https://open.tiktokapis.com/v2/post/publish/video/delete/", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: externalPostId }),
      });
      break;
    }
  }
}

export async function GET(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();

  const { data: group, error: gErr } = await admin
    .from("post_groups")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (gErr) return Response.json({ error: gErr.message }, { status: 500 });
  if (!group) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: posts, error: pErr } = await admin
    .from("scheduled_posts")
    .select("*, page:page_id(display_name)")
    .eq("group_id", params.id)
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (pErr) return Response.json({ error: pErr.message }, { status: 500 });

  return Response.json({ ...group, posts });
}

export async function PATCH(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const body = await request.json();
  const { name, scheduled_at } = body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: group, error: gErr } = await admin
    .from("post_groups")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (gErr) return Response.json({ error: gErr.message }, { status: 500 });

  if (scheduled_at !== undefined) {
    await admin
      .from("scheduled_posts")
      .update({ scheduled_at })
      .eq("group_id", params.id)
      .eq("user_id", user.id);
  }

  return Response.json(group);
}

export async function DELETE(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();

  const { data: posts, error: fetchErr } = await admin
    .from("scheduled_posts")
    .select("id, external_post_id, platform, page_id")
    .eq("group_id", params.id)
    .eq("user_id", user.id);

  if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 });

  for (const post of posts || []) {
    if (post.external_post_id) {
      const { data: tokenRow } = await admin
        .from("page_tokens")
        .select("access_token")
        .eq("page_id", post.page_id)
        .eq("platform", post.platform)
        .maybeSingle();

      if (tokenRow?.access_token) {
        await deleteFromPlatform(post.platform, post.external_post_id, tokenRow.access_token);
      }
    }
  }

  const { error: delPosts } = await admin
    .from("scheduled_posts")
    .delete()
    .eq("group_id", params.id)
    .eq("user_id", user.id);

  if (delPosts) return Response.json({ error: delPosts.message }, { status: 500 });

  const { error: delGroup } = await admin
    .from("post_groups")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (delGroup) return Response.json({ error: delGroup.message }, { status: 500 });

  return new Response(null, { status: 204 });
}
