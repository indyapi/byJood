import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { id } = await params;
  const { data: post, error } = await admin
    .from("scheduled_posts")
    .select("id, external_post_id, platform, page_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: page } = await admin
    .from("pages")
    .select("external_page_id")
    .eq("id", post.page_id)
    .single();

  const pagePicture = page?.external_page_id
    ? `https://graph.facebook.com/v25.0/${encodeURIComponent(page.external_page_id)}/picture?type=large`
    : null;
  const fallbackPermalink = post.external_post_id
    ? `https://facebook.com/${post.external_post_id}`
    : null;

  if (!post.external_post_id || !["facebook", "instagram", "threads"].includes(post.platform)) {
    return Response.json({
      reactions: null, comments: null, shares: null, permalink_url: fallbackPermalink,
      page_picture: pagePicture,
    });
  }

  const { data: tokenRow } = await admin
    .from("page_tokens")
    .select("access_token")
    .eq("page_id", post.page_id)
    .eq("platform", post.platform)
    .maybeSingle();

  if (!tokenRow?.access_token) {
    return Response.json({
      reactions: null, comments: null, shares: null, permalink_url: fallbackPermalink,
      page_picture: pagePicture,
    });
  }

  try {
    const url = `https://graph.facebook.com/v25.0/${encodeURIComponent(post.external_post_id)}?fields=reactions.summary(true),comments.summary(true),shares,permalink_url&access_token=${encodeURIComponent(tokenRow.access_token)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.error) {
      return Response.json({
        reactions: null, comments: null, shares: null, permalink_url: fallbackPermalink, error: data.error.message,
        page_picture: pagePicture,
      });
    }
    return Response.json({
      reactions: data?.reactions?.summary?.total_count ?? null,
      comments: data?.comments?.summary?.total_count ?? null,
      shares: data?.shares?.count ?? null,
      permalink_url: data?.permalink_url ?? fallbackPermalink,
      page_picture: pagePicture,
    });
  } catch {
    return Response.json({
      reactions: null, comments: null, shares: null, permalink_url: fallbackPermalink,
      page_picture: pagePicture,
    });
  }
}
