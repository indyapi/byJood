import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

async function authorize(admin, id, user) {
  const { data: folder } = await admin
    .from("folders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!folder) return { error: "Not found", status: 404 };
  return { folder };
}

export async function PATCH(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const auth = await authorize(admin, params.id, user);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const updates = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return Response.json({ error: "name is required" }, { status: 400 });
    updates.name = name;
  }
  if (body.is_favorite !== undefined) updates.is_favorite = !!body.is_favorite;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("folders")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const auth = await authorize(admin, params.id, user);
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status });

  const { folder } = auth;

  // Move child folders up one level (to the deleted folder's parent or root)
  await admin.from("folders").update({ parent_id: folder.parent_id }).eq("parent_id", folder.id);
  // Detach pages inside the deleted folder (move them to root)
  await admin.from("pages").update({ folder_id: null }).eq("folder_id", folder.id);

  const { error } = await admin.from("folders").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 });
}
