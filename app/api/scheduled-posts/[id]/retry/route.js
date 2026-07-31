import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

// Re-queue a failed post: reset status to 'pending' so the next cron tick enqueues it again.
export async function POST(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();

  const { data: post, error: fetchError } = await admin
    .from("scheduled_posts")
    .select("status")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  if (post.status !== "failed") {
    return Response.json({ error: "Only failed posts can be retried" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("scheduled_posts")
    .update({
      status: "pending",
      error_message: null,
      failed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
