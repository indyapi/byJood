import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("scheduled_posts")
    .select("*, page:page_id(display_name, platform, external_page_id)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const body = await request.json();

  const allowedFields = ["content", "scheduled_at", "media_urls"];
  const updates = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await admin
    .from("scheduled_posts")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();

  const { data: post, error: fetchError } = await admin
    .from("scheduled_posts")
    .select("external_post_id, platform, page_id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

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

  const { error: deleteError } = await admin
    .from("scheduled_posts")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });
  return new Response(null, { status: 204 });
}

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
