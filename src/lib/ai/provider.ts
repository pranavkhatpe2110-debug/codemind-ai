import "server-only";
import { extractText, getAnthropic } from "@/lib/anthropic/client";
import { AI_MODEL, MAX_OUTPUT_TOKENS } from "@/lib/anthropic/config";
import { logAiError, toApiFailure } from "@/lib/anthropic/errors";
import { streamText as anthropicStream } from "@/lib/anthropic/stream";
import { logGeminiError, toGeminiFailure } from "@/lib/gemini/errors";
import { geminiGenerate, geminiStream } from "@/lib/gemini/generate";
import type { AiRequest, ApiFailure } from "./types";

// The ONE place the rest of the app talks to. Every AI feature (Assistant,
// Debugger, Explain / Fix / Generate / Optimize) calls these functions, so
// switching between Gemini and Claude is a single line in .env.local:
//
//   AI_PROVIDER=gemini      (default)
//   AI_PROVIDER=anthropic   (Claude, needs Anthropic API credit)

export type AiProvider = "gemini" | "anthropic";

export function getProvider(): AiProvider {
  return process.env.AI_PROVIDER?.trim().toLowerCase() === "anthropic"
    ? "anthropic"
    : "gemini";
}

export async function generateText(
  req: AiRequest,
): Promise<{ text: string; model: string; provider: AiProvider }> {
  const provider = getProvider();

  if (provider === "anthropic") {
    const message = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: Math.min(req.maxTokens ?? MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
      system: req.system,
      messages: req.messages,
    });
    return { text: extractText(message), model: message.model, provider };
  }

  const result = await geminiGenerate(req);
  return { ...result, provider };
}

export async function streamAiText(req: AiRequest): Promise<Response> {
  if (getProvider() === "anthropic") {
    return anthropicStream({
      system: req.system,
      messages: req.messages,
      maxTokens: req.maxTokens,
      signal: req.signal,
    });
  }
  return geminiStream(req);
}

export function toAiFailure(err: unknown): ApiFailure {
  return getProvider() === "anthropic" ? toApiFailure(err) : toGeminiFailure(err);
}

export function logAi(where: string, err: unknown) {
  if (getProvider() === "anthropic") logAiError(where, err);
  else logGeminiError(where, err);
}
