import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { retryState, applyRetryFields, RETRY_MAX, RETRY_WINDOW_MS } from "@/lib/retry-limit";

export async function POST(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { id } = await params;

  const { data: group, error: gErr } = await admin
    .from("post_groups")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (gErr) return Response.json({ error: gErr.message }, { status: 500 });
  if (!group) return Response.json({ error: "Not found" }, { status: 404 });

  const state = retryState(group);
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
  const fields = applyRetryFields(group, nowIso);

  const { error: pErr } = await admin
    .from("scheduled_posts")
    .update({ status: "pending", error_message: null, failed_at: null, updated_at: nowIso })
    .eq("group_id", id)
    .eq("status", "failed")
    .eq("user_id", user.id);

  if (pErr) return Response.json({ error: pErr.message }, { status: 500 });

  const { data: updated, error: uErr } = await admin
    .from("post_groups")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (uErr) return Response.json({ error: uErr.message }, { status: 500 });

  const nextState = retryState(updated);

  return Response.json({
    ...updated,
    retryMax: RETRY_MAX,
    retryWindowMs: RETRY_WINDOW_MS,
    remaining: nextState.remaining,
    cooldownUntilMs: nextState.cooldownUntilMs,
  });
}
