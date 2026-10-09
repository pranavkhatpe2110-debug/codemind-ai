// A simple "max requests per minute" limiter, per logged-in user.
//
// IMPORTANT: this lives in the server's memory, so on Vercel each server
// instance counts separately. It stops accidents and simple abuse. Phase 14
// adds a stronger, database-backed limit.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

const hits = new Map<string, number[]>();

export function checkRateLimit(
  userId: string,
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(userId, recent);
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 1000)),
    };
  }

  recent.push(now);
  hits.set(userId, recent);

  // Keep memory small: forget users who have been quiet.
  if (hits.size > 1000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return { ok: true };
}
