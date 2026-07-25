import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function DELETE(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { id } = params;

  const { data: page } = await admin
    .from("pages")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!page) return Response.json({ error: "Not found" }, { status: 404 });
  if (page.user_id !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await admin.from("pages").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 });
}
