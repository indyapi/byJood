import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET() {
  const admin = createAdminSupabase();
  const { data: pages, error } = await admin
    .from("pages")
    .select("*, page_tokens(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(pages);
}

export async function POST(request) {
  const admin = createAdminSupabase();
  const body = await request.json();
  const { platform, display_name, external_page_id, fields } = body;

  if (!platform || !display_name || !external_page_id) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: page, error: pageError } = await admin
    .from("pages")
    .insert({
      platform,
      external_page_id,
      display_name,
    })
    .select()
    .single();

  if (pageError) {
    return Response.json({ error: pageError.message }, { status: 500 });
  }

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

    if (tokenError) {
      return Response.json({ error: tokenError.message }, { status: 500 });
    }
  }

  const { data: fullPage } = await admin
    .from("pages")
    .select("*, page_tokens(*)")
    .eq("id", page.id)
    .single();

  return Response.json(fullPage, { status: 201 });
}
