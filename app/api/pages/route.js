import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

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

  // Fetch real page names from platform API for Facebook/Instagram/Threads
  await Promise.all(pages.map(async (page) => {
    const token = page.page_tokens?.[0];
    if (!token?.access_token) return;
    const name = await fetchPlatformPageName(page.platform, page.external_page_id, token.access_token);
    if (name) page.platform_name = name;
  }));

  return Response.json(pages);
}

async function fetchPlatformPageName(platform, externalPageId, accessToken) {
  if (!accessToken) return null;
  try {
    if (["facebook", "instagram", "threads"].includes(platform)) {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${externalPageId}?fields=name&access_token=${accessToken}`
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
  const { platform, display_name, external_page_id, fields } = body;

  if (!platform || !external_page_id) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const resolvedName = display_name || (await fetchPlatformPageName(platform, external_page_id, fields?.access_token));
  if (!resolvedName) {
    return Response.json({ error: "display_name is required" }, { status: 400 });
  }

  const { data: page, error: pageError } = await admin
    .from("pages")
    .insert({ platform, external_page_id, display_name: resolvedName, user_id: user.id })
    .select()
    .single();

  if (pageError) return Response.json({ error: pageError.message }, { status: 500 });

  if (fields?.access_token || fields?.app_id || fields?.app_secret) {
    const { error: tokenError } = await admin
      .from("page_tokens")
      .insert({
        page_id: page.id,
        platform,
        app_id: fields.app_id || null,
        app_secret: fields.app_secret || null,
        access_token: fields.access_token || "",
      });

    if (tokenError) return Response.json({ error: tokenError.message }, { status: 500 });
  }

  const { data: fullPage } = await admin
    .from("pages")
    .select("*, page_tokens(*)")
    .eq("id", page.id)
    .single();

  return Response.json(fullPage, { status: 201 });
}
