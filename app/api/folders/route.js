import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || []);
}

export async function POST(request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const body = await request.json();
  const name = String(body.name || "").trim();
  const parentId = body.parent_id || null;

  if (!name) return Response.json({ error: "name is required" }, { status: 400 });

  if (parentId) {
    const { data: parent } = await admin
      .from("folders")
      .select("id")
      .eq("id", parentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!parent) return Response.json({ error: "Parent folder not found" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("folders")
    .insert({ name, parent_id: parentId, user_id: user.id })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
