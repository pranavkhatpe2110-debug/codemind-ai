import "server-only";
import type { ApiFailure } from "@/lib/ai/types";
import { MissingGeminiKeyError } from "./client";

function describe(err: unknown) {
  const e = (err ?? {}) as { status?: unknown; message?: unknown; name?: unknown };
  return {
    status: typeof e.status === "number" ? e.status : undefined,
    name: typeof e.name === "string" ? e.name : "Error",
    message: typeof e.message === "string" ? e.message : String(err),
  };
}

/**
 * Turns any error from Gemini into a safe, helpful message for the browser.
 * We never send the raw error text to the browser.
 */
export function toGeminiFailure(err: unknown): ApiFailure {
  if (err instanceof MissingGeminiKeyError) {
    return {
      status: 503,
      message:
        "AI is not set up yet. Add GEMINI_API_KEY to .env.local and restart the app.",
    };
  }

  const { status, message } = describe(err);

  if (/api key/i.test(message) && (status === 400 || status === 401 || status === 403)) {
    return {
      status: 502,
      message:
        "The AI key was rejected. Check GEMINI_API_KEY in .env.local, then restart the app.",
    };
  }
  if (status === 401 || status === 403) {
    return {
      status: 502,
      message:
        "The AI key is not allowed to use this model. Check GEMINI_API_KEY and GEMINI_MODEL in .env.local.",
    };
  }
  if (status === 404) {
    return {
      status: 502,
      message: "The AI model was not found. Check GEMINI_MODEL in .env.local.",
    };
  }
  if (status === 429) {
    return {
      status: 429,
      message:
        "The free AI limit has been reached for now. Wait a minute and try again. If it keeps happening, the daily limit may be used up. Try again tomorrow.",
    };
  }
  if (status === 400) {
    return { status: 400, message: "The AI could not process this request." };
  }
  if (status !== undefined && status >= 500) {
    return {
      status: 502,
      message: "The AI service had a problem. Please try again.",
    };
  }
  if (/fetch failed|network|ENOTFOUND|ECONN|ETIMEDOUT/i.test(message)) {
    return {
      status: 502,
      message: "Could not reach the AI service. Please try again.",
    };
  }
  return { status: 500, message: "Something went wrong. Please try again." };
}

/** Log what happened on the server (never the API key, never user code). */
export function logGeminiError(where: string, err: unknown) {
  const { status, name, message } = describe(err);
  console.error(`[${where}] Gemini error`, { status, name, message });
}
