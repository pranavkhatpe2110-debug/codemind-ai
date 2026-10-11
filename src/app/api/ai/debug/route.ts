import { NextResponse } from "next/server";
import { generateText, logAi, toAiFailure } from "@/lib/ai/provider";
import { DEBUG_SYSTEM_PROMPT } from "@/lib/anthropic/prompts";
import { guardAiRequest, jsonError } from "@/lib/api/guard";
import { parseDebugResult } from "@/lib/debugger/parse";
import {
  DEBUG_LANGUAGES,
  MAX_DEBUG_CODE_CHARS,
  MAX_DEBUG_ERROR_CHARS,
} from "@/lib/debugger/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Allow up to 60 seconds, so a long AI answer is not cut off on Vercel.
export const maxDuration = 60;

// The AI Debugger. The code is only SENT TO THE AI as text. It is never run.
export async function POST(request: Request) {
  const guard = await guardAiRequest(request);
  if (!guard.ok) return guard.response;

  const b = (guard.body ?? {}) as { language?: unknown; code?: unknown; errorMessage?: unknown };
  const language = typeof b.language === "string" ? b.language : "";
  const code = typeof b.code === "string" ? b.code : "";
  const errorMessage = typeof b.errorMessage === "string" ? b.errorMessage : "";

  if (!(DEBUG_LANGUAGES as readonly string[]).includes(language)) {
    return jsonError("Please choose a language from the list.", 400);
  }
  if (!code.trim()) return jsonError("Please paste some code first.", 400);
  if (code.length > MAX_DEBUG_CODE_CHARS) {
    return jsonError(`The code is too long (max ${MAX_DEBUG_CODE_CHARS} characters).`, 413);
  }
  if (errorMessage.length > MAX_DEBUG_ERROR_CHARS) {
    return jsonError(`The error message is too long (max ${MAX_DEBUG_ERROR_CHARS} characters).`, 413);
  }

  const supabase = await createClient();
  const userId = guard.user.id;

  const { data: row, error: insertError } = await supabase
    .from("debug_sessions")
    .insert({
      user_id: userId,
      language,
      code,
      error_message: errorMessage,
      status: "pending",
    })
    .select("id")
    .single();
  if (insertError || !row) return jsonError("Could not save the debug session.", 500);
  const sessionId = row.id as string;

  async function finish(status: "completed" | "failed", result: unknown) {
    const { error } = await supabase
      .from("debug_sessions")
      .update({ status, result, updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", userId);
    if (error) console.error("[ai/debug] could not update session", error.message);
  }

  try {
    const { text } = await generateText({
      system: DEBUG_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Language: ${language}\n\n<code>\n${code}\n</code>\n\n<error>\n${errorMessage || "(no error message given)"}\n</error>`,
        },
      ],
      maxTokens: 4096,
    });

    const result = parseDebugResult(text);
    if (!result) {
      await finish("failed", null);
      return jsonError("The AI answer could not be read. Please try again.", 502);
    }
    await finish("completed", result);
    return NextResponse.json({ ok: true, id: sessionId, result });
  } catch (err) {
    logAi("ai/debug", err);
    await finish("failed", null);
    const failure = toAiFailure(err);
    return jsonError(failure.message, failure.status);
  }
}
