import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { retryState, applyRetryFields, RETRY_MAX, RETRY_WINDOW_MS } from "@/lib/retry-limit";

// Re-queue a failed post: reset status to 'pending' so the next cron tick enqueues it again.
export async function POST(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { id } = await params;

  const { data: post, error: fetchError } = await admin
    .from("scheduled_posts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  if (post.status !== "failed") {
    return Response.json({ error: "Only failed posts can be retried" }, { status: 400 });
  }

  const state = retryState(post);
  if (!state.allowed) {
    return Response.json(
      {
        error: "rate_limited",
        message: "retryRateLimited",
        cooldownUntilMs: state.cooldownUntilMs,
        remaining: state.remaining,
      },
      { status: 429 }
    );
  }

  const nowIso = new Date().toISOString();
  const fields = applyRetryFields(post, nowIso);

  const { data, error } = await admin
    .from("scheduled_posts")
    .update({
      ...fields,
      status: "pending",
      error_message: null,
      failed_at: null,
      updated_at: nowIso,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const nextState = retryState(data);

  return Response.json({
    ...data,
    retryMax: RETRY_MAX,
    retryWindowMs: RETRY_WINDOW_MS,
    remaining: nextState.remaining,
    cooldownUntilMs: nextState.cooldownUntilMs,
  });
}
