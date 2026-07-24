import { createAdminSupabase } from "@/lib/supabase-admin";

export async function DELETE(request, { params }) {
  const admin = createAdminSupabase();
  const { id } = params;

  const { error } = await admin
    .from("pages")
    .delete()
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
