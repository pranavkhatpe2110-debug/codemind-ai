import { NextResponse } from "next/server";
import { generateText, logAi, streamAiText, toAiFailure } from "@/lib/ai/provider";
import { BASE_SYSTEM_PROMPT } from "@/lib/anthropic/prompts";
import { guardAiRequest, jsonError } from "@/lib/api/guard";

export const runtime = "nodejs";

// A small test route to check that the AI works. Used by the /ai-test page.
export async function POST(request: Request) {
  const guard = await guardAiRequest(request);
  if (!guard.ok) return guard.response;

  const mode =
    typeof guard.body === "object" &&
    guard.body !== null &&
    (guard.body as { mode?: unknown }).mode === "stream"
      ? "stream"
      : "normal";

  try {
    if (mode === "stream") {
      return await streamAiText({
        system: BASE_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content:
              "Count from 1 to 5, one number per line. Then add one short sentence of encouragement for a beginner programmer.",
          },
        ],
        maxTokens: 1024,
        signal: request.signal,
      });
    }

    const result = await generateText({
      system: BASE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content:
            "Reply with exactly this sentence and nothing else: CodeMind AI is connected.",
        },
      ],
      maxTokens: 1024,
    });

    return NextResponse.json({
      ok: true,
      reply: result.text,
      model: result.model,
      provider: result.provider,
    });
  } catch (err) {
    logAi("ai/health", err);
    const failure = toAiFailure(err);
    return jsonError(failure.message, failure.status);
  }
}
