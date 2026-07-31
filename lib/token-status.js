const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 7;

/**
 * Determine token status: "active" | "expired" | "expiring_soon"
 * Facebook-family tokens are validated against the Graph API (/debug_token).
 * Non-Facebook platforms fall back to the stored expires_at when available.
 */
export async function checkTokenStatus(platform, accessToken, appId, appSecret, storedExpiresAt) {
  const fromExpiry = (expiresAt) => {
    const exp = new Date(expiresAt).getTime();
    const daysLeft = (exp - Date.now()) / DAY_MS;
    if (daysLeft <= 0) return { status: "expired", expires_at: expiresAt };
    if (daysLeft < EXPIRING_SOON_DAYS) return { status: "expiring_soon", expires_at: expiresAt };
    return { status: "active", expires_at: expiresAt };
  };

  if (storedExpiresAt) return fromExpiry(storedExpiresAt);

  if (!["facebook", "instagram", "threads"].includes(platform)) {
    return { status: "active", expires_at: null };
  }

  try {
    const debugAccessToken = appId && appSecret ? `${appId}|${appSecret}` : accessToken;
    const res = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(debugAccessToken)}`
    );
    const data = await res.json();
    const info = data?.data;
    if (data?.error || !info || info.is_valid === false || info.error) {
      return { status: "expired", expires_at: null };
    }
    if (info.expires_at) {
      return fromExpiry(new Date(info.expires_at * 1000).toISOString());
    }
    return { status: "active", expires_at: null };
  } catch {
    return { status: "active", expires_at: null };
  }
}
