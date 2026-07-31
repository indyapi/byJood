import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { data: post, error } = await admin
    .from("scheduled_posts")
    .select("id, external_post_id, platform, page_id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  const { data: page } = await admin
    .from("pages")
    .select("external_page_id")
    .eq("id", post.page_id)
    .single();

  if (!post.external_post_id || !["facebook", "instagram", "threads"].includes(post.platform)) {
    return Response.json({
      reactions: null, comments: null, shares: null,
      page_picture: page?.external_page_id
        ? `https://graph.facebook.com/v25.0/${encodeURIComponent(page.external_page_id)}/picture?type=large`
        : null,
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
      reactions: null, comments: null, shares: null,
      page_picture: page?.external_page_id
        ? `https://graph.facebook.com/v25.0/${encodeURIComponent(page.external_page_id)}/picture?type=large`
        : null,
    });
  }

  try {
    const url = `https://graph.facebook.com/v25.0/${encodeURIComponent(post.external_post_id)}?fields=reactions.summary(true),comments.summary(true),shares&access_token=${encodeURIComponent(tokenRow.access_token)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.error) {
      return Response.json({
        reactions: null, comments: null, shares: null, error: data.error.message,
        page_picture: page?.external_page_id
          ? `https://graph.facebook.com/v25.0/${encodeURIComponent(page.external_page_id)}/picture?type=large`
          : null,
      });
    }
    return Response.json({
      reactions: data?.reactions?.summary?.total_count ?? null,
      comments: data?.comments?.summary?.total_count ?? null,
      shares: data?.shares?.count ?? null,
      page_picture: page?.external_page_id
        ? `https://graph.facebook.com/v25.0/${encodeURIComponent(page.external_page_id)}/picture?type=large`
        : null,
    });
  } catch {
    return Response.json({
      reactions: null, comments: null, shares: null,
      page_picture: page?.external_page_id
        ? `https://graph.facebook.com/v25.0/${encodeURIComponent(page.external_page_id)}/picture?type=large`
        : null,
    });
  }
}
