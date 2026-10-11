import "server-only";
import { extractText, getAnthropic } from "@/lib/anthropic/client";
import { AI_MODEL, MAX_OUTPUT_TOKENS } from "@/lib/anthropic/config";
import { logAiError, toApiFailure } from "@/lib/anthropic/errors";
import { streamText as anthropicStream } from "@/lib/anthropic/stream";
import { logGeminiError, toGeminiFailure } from "@/lib/gemini/errors";
import { geminiGenerate, geminiStream } from "@/lib/gemini/generate";
import { compatChunks, compatGenerate } from "@/lib/openai-compat/client";
import { logCompatError, toCompatFailure } from "@/lib/openai-compat/errors";
import { mockChunks, mockGenerate } from "@/lib/mock/mock";
import { textStreamResponse } from "./text-stream";
import type { AiRequest, ApiFailure } from "./types";

// The ONE place the rest of the app talks to. Every AI feature (Assistant,
// Debugger, Explain / Fix / Generate / Optimize) calls these functions, so
// switching between Gemini and Claude is a single line in .env.local:
//
//   AI_PROVIDER=gemini      (default)
//   AI_PROVIDER=anthropic   (Claude, needs Anthropic API credit)
//   AI_PROVIDER=openai      (any OpenAI-compatible service: Groq, OpenRouter...)
//   AI_PROVIDER=mock        (fake answers, no key, for testing the screens)

export type AiProvider = "gemini" | "anthropic" | "openai" | "mock";

export function getProvider(): AiProvider {
  const v = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (v === "anthropic" || v === "openai" || v === "mock") return v;
  return "gemini";
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

  if (provider === "mock") return { ...(await mockGenerate(req)), provider };
  if (provider === "openai") return { ...(await compatGenerate(req)), provider };

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
  const p = getProvider();
  if (p === "mock") return textStreamResponse(mockChunks(req));
  if (p === "openai") return textStreamResponse(compatChunks(req));
  return geminiStream(req);
}

export function toAiFailure(err: unknown): ApiFailure {
  const p = getProvider();
  if (p === "anthropic") return toApiFailure(err);
  if (p === "openai") return toCompatFailure(err);
  return toGeminiFailure(err);
}

export function logAi(where: string, err: unknown) {
  const p = getProvider();
  if (p === "anthropic") logAiError(where, err);
  else if (p === "openai") logCompatError(where, err);
  else logGeminiError(where, err);
}
