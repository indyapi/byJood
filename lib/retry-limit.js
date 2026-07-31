// Manual retry rate limit: max RETRY_MAX retries within a RETRY_WINDOW_MS rolling window.
// The window starts at the first retry press (retry_window_start). Once the window has
// elapsed, the quota resets to 0 and the button re-enables.

export const RETRY_MAX = 3;
export const RETRY_WINDOW_MS = 60 * 60 * 1000;

function toMs(value) {
  if (!value) return 0;
  const n = typeof value === "number" ? value : Date.parse(value);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Compute the retry state for a row that has retry_count / last_retry_at / retry_window_start.
 * @returns {{ allowed: boolean, remaining: number, cooldownUntilMs: number|null }}
 *   cooldownUntilMs is the absolute ms time when the button becomes usable again.
 */
export function retryState(row, nowMs = Date.now()) {
  const count = Number(row.retry_count) || 0;
  const windowStart = toMs(row.retry_window_start);

  // No active window (never retried or quota already reset).
  if (!windowStart || nowMs - windowStart >= RETRY_WINDOW_MS) {
    return { allowed: true, remaining: RETRY_MAX, cooldownUntilMs: null };
  }

  const cooldownUntilMs = windowStart + RETRY_WINDOW_MS;
  const remaining = Math.max(0, RETRY_MAX - count);
  return { allowed: remaining > 0, remaining, cooldownUntilMs };
}

/**
 * Produce the updated rate-limit fields after one successful retry press.
 * @returns {{ retry_count: number, last_retry_at: string, retry_window_start: string|null }}
 */
export function applyRetryFields(row, nowIso = new Date().toISOString()) {
  const nowMs = Date.parse(nowIso);
  const state = retryState(row, nowMs);
  // Window expired / not started -> open a fresh window with the first press.
  if (!state.cooldownUntilMs) {
    return { retry_count: 1, last_retry_at: nowIso, retry_window_start: nowIso };
  }
  return {
    retry_count: (Number(row.retry_count) || 0) + 1,
    last_retry_at: nowIso,
    retry_window_start: row.retry_window_start || nowIso,
  };
}
