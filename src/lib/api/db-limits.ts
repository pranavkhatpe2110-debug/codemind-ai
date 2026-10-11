import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// A stronger limit than the in-memory one: it is stored in the database, so it
// still works when the app runs on several servers (Vercel) or restarts.
// It FAILS OPEN: if the table is missing or the database is down, the AI still
// works (the in-memory limit still applies) and the problem is logged.

const PER_MINUTE = 20;
const PER_DAY = Number.parseInt(process.env.AI_DAILY_LIMIT ?? "", 10) || 300;

export type LimitResult =
  | { ok: true }
  | { ok: false; status: 429; message: string; retryAfterSeconds: number };

async function countSince(supabase: SupabaseClient, userId: string, since: Date) {
  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export async function checkDbLimits(supabase: SupabaseClient, userId: string): Promise<LimitResult> {
  try {
    const now = Date.now();
    const [minute, day] = await Promise.all([
      countSince(supabase, userId, new Date(now - 60_000)),
      countSince(supabase, userId, new Date(now - 86_400_000)),
    ]);

    if (minute >= PER_MINUTE) {
      return {
        ok: false,
        status: 429,
        message: "Too many requests. Please wait a minute.",
        retryAfterSeconds: 60,
      };
    }
    if (day >= PER_DAY) {
      return {
        ok: false,
        status: 429,
        message: "You reached today's AI limit. Please try again tomorrow.",
        retryAfterSeconds: 3600,
      };
    }

    const { error } = await supabase.from("ai_usage").insert({ user_id: userId });
    if (error) throw error;

    // Tidy up now and then: forget rows older than 2 days.
    if (Math.random() < 0.05) {
      await supabase
        .from("ai_usage")
        .delete()
        .eq("user_id", userId)
        .lt("created_at", new Date(now - 2 * 86_400_000).toISOString());
    }
    return { ok: true };
  } catch (err) {
    console.error("[ai limits] database limit skipped:", (err as { message?: string })?.message);
    return { ok: true };
  }
}
