import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();

  const { data: userPages } = await admin
    .from("pages")
    .select("id")
    .eq("user_id", user.id);

  const pageIds = userPages?.map((p) => p.id) ?? [];

  const { data, error } = await admin
    .from("post_logs")
    .select("*")
    .in("page_id", pageIds.length > 0 ? pageIds : [null])
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
