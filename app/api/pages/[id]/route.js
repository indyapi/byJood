import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

async function authorize(admin, id, user) {
  const { data: page } = await admin
    .from("pages")
    .select("user_id")
    .eq("id", id)
    .single();
  if (!page) return { error: "Not found", status: 404 };
  if (page.user_id !== user.id) return { error: "Forbidden", status: 403 };
  return { page };
}

export async function DELETE(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { id } = params;
  const auth = await authorize(admin, id, user);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { error } = await admin.from("pages").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 });
}

export async function PATCH(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { id } = params;
  const auth = await authorize(admin, id, user);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { display_name, label, app_id, app_secret, access_token, page_id: tokenPageId } = body;

  // Update pages table if display_name/label provided
  const name = display_name || label;
  if (name && name.trim()) {
    const { error } = await admin.from("pages").update({ display_name: name.trim() }).eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  // Update page_tokens if any token fields provided
  const tokenFields = {};
  if (app_id !== undefined) tokenFields.app_id = app_id || null;
  if (app_secret !== undefined) tokenFields.app_secret = app_secret || null;
  if (access_token !== undefined) tokenFields.access_token = access_token || "";

  if (Object.keys(tokenFields).length > 0) {
    const { data: existing } = await admin
      .from("page_tokens")
      .select("id, app_id, app_secret, access_token")
      .eq("page_id", id)
      .maybeSingle();

    if (existing) {
      // Only update fields that have new values; keep old values for empty/whitespace
      const updates = {};
      if (tokenFields.app_id !== undefined && tokenFields.app_id !== null) {
        // If the input is not empty/whitespace, use it; otherwise keep old value (skip)
      }
      // Simpler: apply tokenFields directly — the caller sends only what changed
      const merged = { ...existing, ...tokenFields };
      // Keep existing values for empty strings
      if (tokenFields.app_id !== undefined && tokenFields.app_id !== null) {
        if (tokenFields.app_id.trim()) merged.app_id = tokenFields.app_id.trim();
        else merged.app_id = existing.app_id;
      }
      if (tokenFields.app_secret !== undefined && tokenFields.app_secret !== null) {
        if (tokenFields.app_secret.trim()) merged.app_secret = tokenFields.app_secret.trim();
        else merged.app_secret = existing.app_secret;
      }
      if (tokenFields.access_token !== undefined && tokenFields.access_token !== null) {
        if (tokenFields.access_token.trim()) merged.access_token = tokenFields.access_token.trim();
        else merged.access_token = existing.access_token;
      }

      const { error } = await admin
        .from("page_tokens")
        .update({
          app_id: merged.app_id,
          app_secret: merged.app_secret,
          access_token: merged.access_token,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
    }
  }

  const { data: fullPage } = await admin
    .from("pages")
    .select("*, page_tokens(*)")
    .eq("id", id)
    .single();

  return Response.json(fullPage);
}
