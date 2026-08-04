import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { checkTokenStatus, deriveStatusFromExpiry } from "@/lib/token-status";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { data: pages, error } = await admin
    .from("pages")
    .select("*, page_tokens(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Read status straight from the DB — never re-verify against the platform on
  // every load. This prevents a freshly-updated (active) token from being
  // wrongly flipped back to "expired" by a transient Graph API failure.
  await Promise.all(pages.map(async (page) => {
    const token = page.page_tokens?.[0];
    if (!token?.access_token) {
      page.status = "expired";
      page.expires_at = null;
      return;
    }

    if (token.expires_at) {
      const derived = deriveStatusFromExpiry(token.expires_at);
      page.status = derived.status;
      page.expires_at = derived.expires_at;
    } else {
      page.status = token.status || "active";
      page.expires_at = null;
    }

    const name = await fetchPlatformPageName(page.platform, page.external_page_id, token.access_token, page.ig_business_account_id);
    if (name && name !== page.display_name) {
      await admin.from("pages").update({ display_name: name }).eq("id", page.id);
      page.display_name = name;
    }
  }));

  return Response.json(pages);
}

async function fetchPlatformPageName(platform, externalPageId, accessToken, igBusinessAccountId) {
  if (!accessToken) return null;
  try {
    if (platform === "threads") {
      const res = await fetch(
        `https://graph.threads.net/v1.0/me?fields=username,id&access_token=${encodeURIComponent(accessToken)}`
      );
      const data = await res.json();
      return data?.username ?? null;
    }
    if (["facebook", "instagram"].includes(platform)) {
      // For Instagram, prefer the IG Business Account ID (it is the node the
      // Graph API posts to); fall back to the FB Page ID for older rows.
      const lookupId = platform === "instagram" && igBusinessAccountId ? igBusinessAccountId : externalPageId;
      const res = await fetch(
        `https://graph.facebook.com/v25.0/${lookupId}?fields=name&access_token=${accessToken}`
      );
      const data = await res.json();
      return data.name ?? null;
    }
  } catch {}
  return null;
}

export async function POST(request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const body = await request.json();
  const { platform, display_name, external_page_id, ig_business_account_id, fields } = body;

  if (!platform || !external_page_id) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const resolvedName = display_name || (await fetchPlatformPageName(platform, external_page_id, fields?.access_token, ig_business_account_id));
  if (!resolvedName) {
    return Response.json({ error: "display_name is required" }, { status: 400 });
  }

  const { data: page, error: pageError } = await admin
    .from("pages")
    .insert({
      platform,
      external_page_id,
      display_name: resolvedName,
      ig_business_account_id: platform === "instagram" ? (ig_business_account_id || null) : null,
      user_id: user.id,
    })
    .select()
    .single();

  if (pageError) return Response.json({ error: pageError.message }, { status: 500 });

  if (fields?.access_token || fields?.app_id || fields?.app_secret) {
    const { data: tokenRow, error: tokenError } = await admin
      .from("page_tokens")
      .insert({
        page_id: page.id,
        platform,
        app_id: fields.app_id || null,
        app_secret: fields.app_secret || null,
        access_token: fields.access_token || "",
      })
      .select("id")
      .single();

    if (tokenError) return Response.json({ error: tokenError.message }, { status: 500 });

    // Persist the freshly-checked status + expiry so GET can read it from the DB
    const { data: fullToken } = await admin
      .from("page_tokens")
      .select("id, app_id, app_secret, access_token")
      .eq("id", tokenRow.id)
      .single();
    const status = await checkTokenStatus(
      platform,
      fullToken.access_token,
      fullToken.app_id,
      fullToken.app_secret,
      null
    );
    await admin
      .from("page_tokens")
      .update({
        status: status.status,
        expires_at: status.expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fullToken.id);
  }

  const { data: fullPage } = await admin
    .from("pages")
    .select("*, page_tokens(*)")
    .eq("id", page.id)
    .single();

  const token = fullPage?.page_tokens?.[0];
  if (token?.access_token) {
    if (token.expires_at) {
      const derived = deriveStatusFromExpiry(token.expires_at);
      fullPage.status = derived.status;
      fullPage.expires_at = derived.expires_at;
    } else {
      fullPage.status = token.status || "active";
      fullPage.expires_at = null;
    }
  } else {
    fullPage.status = "expired";
    fullPage.expires_at = null;
  }

  return Response.json(fullPage, { status: 201 });
}
