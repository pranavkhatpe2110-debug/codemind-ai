import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { MissingApiKeyError } from "./client";

export type ApiFailure = { status: number; message: string };

/**
 * Turns any error from Claude into a safe, helpful message for the browser.
 * We never send the raw error text to the browser.
 */
export function toApiFailure(err: unknown): ApiFailure {
  if (err instanceof MissingApiKeyError) {
    return {
      status: 503,
      message:
        "AI is not set up yet. Add ANTHROPIC_API_KEY to .env.local and restart the app.",
    };
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return {
      status: 502,
      message:
        "The AI key was rejected. Check ANTHROPIC_API_KEY in .env.local, then restart the app.",
    };
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return {
      status: 502,
      message: "This AI key is not allowed to use this model.",
    };
  }
  if (err instanceof Anthropic.NotFoundError) {
    return {
      status: 502,
      message: "The AI model was not found. Check ANTHROPIC_MODEL in .env.local.",
    };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return {
      status: 429,
      message: "The AI service is busy right now. Please try again in a moment.",
    };
  }
  if (err instanceof Anthropic.BadRequestError) {
    if (/credit balance/i.test(messageOf(err))) {
      return {
        status: 402,
        message:
          "The Anthropic account has no credit left. Add credit in the Anthropic Console under Billing.",
      };
    }
    return { status: 400, message: "The AI could not process this request." };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return {
      status: 502,
      message: "Could not reach the AI service. Please try again.",
    };
  }
  if (err instanceof Anthropic.APIError) {
    return {
      status: 502,
      message: "The AI service had a problem. Please try again.",
    };
  }
  return { status: 500, message: "Something went wrong. Please try again." };
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Log what happened on the server (never the API key, never user code). */
export function logAiError(where: string, err: unknown) {
  if (err instanceof Anthropic.APIError) {
    const info = err as { status?: number; name?: string };
    console.error(`[${where}] Claude API error`, {
      status: info.status,
      name: info.name,
      message: messageOf(err),
    });
  } else {
    console.error(`[${where}]`, messageOf(err));
  }
}
