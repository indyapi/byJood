import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function DELETE(request, { params }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const { id } = await params;

  const { data: media, error: fetchError } = await admin
    .from("media")
    .select("id, user_id, storage_path, public_url")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });
  if (!media) return Response.json({ error: "Not found" }, { status: 404 });
  if (media.user_id !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const bucket = extractBucket(media.public_url);

  const { error: removeError } = await admin.storage.from(bucket).remove([media.storage_path]);
  if (removeError) return Response.json({ error: removeError.message }, { status: 500 });

  const { error: deleteError } = await admin.from("media").delete().eq("id", id);
  if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });

  return new Response(null, { status: 204 });
}

function extractBucket(publicUrl) {
  if (!publicUrl) return "media";
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)/);
  return match ? match[1] : "media";
}
