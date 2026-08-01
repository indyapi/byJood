import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { checkTokenStatus, deriveStatusFromExpiry } from "@/lib/token-status";

async function authorize(admin, id, user) {
  const { data: page } = await admin
    .from("pages")
    .select("user_id, platform")
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
  const { display_name, label, app_id, app_secret, access_token, page_id: tokenPageId, folder_id, is_favorite } = body;

  // Update pages table if display_name/label provided
  const name = display_name || label;
  if (name && name.trim()) {
    const { error } = await admin.from("pages").update({ display_name: name.trim() }).eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  // Move to a folder / toggle favorite on the pages row
  const pageUpdates = {};
  if (folder_id !== undefined) {
    if (folder_id) {
      const { data: folderRow } = await admin
        .from("folders")
        .select("id")
        .eq("id", folder_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!folderRow) return Response.json({ error: "Folder not found" }, { status: 404 });
      pageUpdates.folder_id = folder_id;
    } else {
      pageUpdates.folder_id = null;
    }
  }
  if (is_favorite !== undefined) pageUpdates.is_favorite = !!is_favorite;
  if (Object.keys(pageUpdates).length > 0) {
    const { error } = await admin.from("pages").update(pageUpdates).eq("id", id);
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
    } else {
      // No token row yet — create one
      const { data: created, error } = await admin
        .from("page_tokens")
        .insert({
          page_id: id,
          platform: auth.page.platform,
          app_id: tokenFields.app_id ?? null,
          app_secret: tokenFields.app_secret ?? null,
          access_token: tokenFields.access_token ?? "",
        })
        .select("id")
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      if (created?.id) {
        existing = { id: created.id };
      }
    }
  }

  const { data: fullPage } = await admin
    .from("pages")
    .select("*, page_tokens(*)")
    .eq("id", id)
    .single();

  const token = fullPage?.page_tokens?.[0];
  if (token?.access_token) {
    // New token saved? Re-verify immediately and persist the result so the
    // dashboard badge turns green without a refresh.
    if (access_token?.trim()) {
      const status = await checkTokenStatus(
        fullPage.platform,
        token.access_token,
        token.app_id,
        token.app_secret,
        null
      );
      const persisted = {
        status: status.status,
        expires_at: status.expires_at,
        updated_at: new Date().toISOString(),
      };
      await admin.from("page_tokens").update(persisted).eq("id", token.id);
      fullPage.status = status.status;
      fullPage.expires_at = status.expires_at;
    } else {
      // No new token — trust what the DB already knows (never revert a healthy token)
      fullPage.status = token.status || "active";
      fullPage.expires_at = token.expires_at || null;
      if (token.expires_at) {
        const derived = deriveStatusFromExpiry(token.expires_at);
        fullPage.status = derived.status;
        fullPage.expires_at = derived.expires_at;
      }
    }
  } else {
    fullPage.status = "expired";
    fullPage.expires_at = null;
  }

  return Response.json(fullPage);
}
