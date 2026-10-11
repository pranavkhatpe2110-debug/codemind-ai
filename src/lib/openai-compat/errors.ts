import "server-only";
import type { ApiFailure } from "@/lib/ai/types";
import { CompatHttpError, MissingCompatConfigError } from "./client";

export function toCompatFailure(err: unknown): ApiFailure {
  if (err instanceof MissingCompatConfigError) {
    return {
      status: 503,
      message:
        "AI is not set up yet. Add OPENAI_COMPAT_API_KEY and OPENAI_COMPAT_MODEL to .env.local and restart the app.",
    };
  }
  if (err instanceof CompatHttpError) {
    const s = err.status;
    if (s === 401 || s === 403)
      return { status: 502, message: "The AI key was not accepted. Check OPENAI_COMPAT_API_KEY in .env.local, then restart." };
    if (s === 404)
      return { status: 502, message: "The AI model or address was not found. Check OPENAI_COMPAT_MODEL and OPENAI_COMPAT_BASE_URL." };
    if (s === 429)
      return { status: 429, message: "The AI limit has been reached for now. Wait a minute and try again." };
    if (s === 400)
      return { status: 400, message: "The AI could not process this request. The model name may be wrong." };
    if (s >= 500)
      return { status: 502, message: "The AI service had a problem. Please try again." };
  }
  const message = err instanceof Error ? err.message : String(err);
  if (/fetch failed|network|ENOTFOUND|ECONN|ETIMEDOUT/i.test(message))
    return { status: 502, message: "Could not reach the AI service. Please try again." };
  return { status: 500, message: "Something went wrong. Please try again." };
}

export function logCompatError(where: string, err: unknown) {
  const e = err as { status?: number; name?: string; message?: string };
  console.error(`[${where}] OpenAI-compatible error`, {
    status: e?.status,
    name: e?.name,
    message: e?.message,
  });
}
