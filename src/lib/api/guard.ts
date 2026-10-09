import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { MAX_REQUEST_CHARS } from "@/lib/anthropic/config";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "./rate-limit";

export function jsonError(
  message: string,
  status: number,
  headers?: Record<string, string>,
) {
  return NextResponse.json({ ok: false, error: message }, { status, headers });
}

type GuardResult =
  | { ok: true; user: User; body: unknown }
  | { ok: false; response: NextResponse };

/**
 * Every AI route starts with this. It checks, in order:
 *  1. the user is logged in (otherwise 401)
 *  2. the user is not sending too many requests (otherwise 429)
 *  3. the body is not huge and is valid JSON (otherwise 413 / 400)
 */
export async function guardAiRequest(request: Request): Promise<GuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: jsonError("Please log in first.", 401) };
  }

  const limit = checkRateLimit(user.id);
  if (!limit.ok) {
    return {
      ok: false,
      response: jsonError(
        `Too many requests. Please wait ${limit.retryAfterSeconds} seconds.`,
        429,
        { "Retry-After": String(limit.retryAfterSeconds) },
      ),
    };
  }

  const text = await request.text();
  if (text.length > MAX_REQUEST_CHARS) {
    return { ok: false, response: jsonError("That request is too large.", 413) };
  }

  let body: unknown = {};
  if (text.trim() !== "") {
    try {
      body = JSON.parse(text);
    } catch {
      return { ok: false, response: jsonError("Invalid request.", 400) };
    }
  }

  return { ok: true, user, body };
}
