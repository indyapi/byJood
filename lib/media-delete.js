export async function deleteMediaForPublicUrls(admin, publicUrls, userId) {
  const urls = (Array.isArray(publicUrls) ? publicUrls : []).filter(Boolean);
  if (urls.length === 0) return;

  let query = admin
    .from("media")
    .select("id, storage_path, public_url")
    .in("public_url", urls);
  if (userId) query = query.eq("user_id", userId);

  const { data: mediaRows, error } = await query;
  if (error) {
    console.error("[media-delete] fetch media error:", error.message);
    return;
  }

  for (const row of mediaRows || []) {
    const bucket = extractBucket(row.public_url);
    try {
      const { error: removeError } = await admin.storage.from(bucket).remove([row.storage_path]);
      if (removeError) {
        console.error(`[media-delete] storage remove failed: ${row.storage_path}`, removeError.message);
      }
    } catch (err) {
      console.error(`[media-delete] storage remove threw: ${row.storage_path}`, err);
    }
  }

  const ids = (mediaRows || []).map((r) => r.id);
  if (ids.length > 0) {
    const { error: delError } = await admin.from("media").delete().in("id", ids);
    if (delError) console.error("[media-delete] media delete error:", delError.message);
  }
}

function extractBucket(publicUrl) {
  if (!publicUrl) return "media";
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)/);
  return match ? match[1] : "media";
}
