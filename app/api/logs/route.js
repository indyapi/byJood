import { createAdminSupabase } from "@/lib/supabase-admin";

export async function GET() {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("post_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
