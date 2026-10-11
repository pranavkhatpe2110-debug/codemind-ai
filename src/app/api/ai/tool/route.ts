import { logAi, streamAiText, toAiFailure } from "@/lib/ai/provider";
import { TOOL_SYSTEM_PROMPTS } from "@/lib/anthropic/prompts";
import { guardAiRequest, jsonError } from "@/lib/api/guard";
import { makeTitle } from "@/lib/assistant/limits";
import { DEBUG_LANGUAGES } from "@/lib/debugger/types";
import {
  MAX_TOOL_EXTRA_CHARS,
  MAX_TOOL_INPUT_CHARS,
  TOOLS,
  isToolId,
} from "@/lib/tools/config";
import { passThroughAndSave } from "@/lib/tools/stream-save";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Allow up to 60 seconds, so a long AI answer is not cut off on Vercel.
export const maxDuration = 60;

// Explain / Fix / Generate / Optimize. The code is only sent to the AI as text.
// It is never run on our server.
export async function POST(request: Request) {
  const guard = await guardAiRequest(request);
  if (!guard.ok) return guard.response;

  const b = (guard.body ?? {}) as {
    tool?: unknown;
    language?: unknown;
    input?: unknown;
    extra?: unknown;
  };
  if (!isToolId(b.tool)) return jsonError("Unknown tool.", 400);
  const tool = b.tool;
  const language = typeof b.language === "string" ? b.language : "";
  const input = typeof b.input === "string" ? b.input : "";
  const extra = typeof b.extra === "string" ? b.extra : "";

  if (!(DEBUG_LANGUAGES as readonly string[]).includes(language)) {
    return jsonError("Please choose a language from the list.", 400);
  }
  if (!input.trim()) return jsonError("Please fill in the main box first.", 400);
  if (input.length > MAX_TOOL_INPUT_CHARS) {
    return jsonError(`That is too long (max ${MAX_TOOL_INPUT_CHARS} characters).`, 413);
  }
  if (extra.length > MAX_TOOL_EXTRA_CHARS) {
    return jsonError(`The extra box is too long (max ${MAX_TOOL_EXTRA_CHARS} characters).`, 413);
  }

  const content =
    `Language: ${language}\n\n<input>\n${input}\n</input>` +
    (extra.trim() ? `\n\n<extra>\n${extra}\n</extra>` : "");

  let ai: Response;
  try {
    ai = await streamAiText({
      system: TOOL_SYSTEM_PROMPTS[tool],
      messages: [{ role: "user", content }],
      maxTokens: 4096,
      signal: request.signal,
    });
  } catch (err) {
    logAi(`ai/tool/${tool}`, err);
    const failure = toAiFailure(err);
    return jsonError(failure.message, failure.status);
  }
  if (!ai.body) return jsonError("The AI returned nothing.", 502);

  const supabase = await createClient();
  const userId = guard.user.id;

  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title: makeTitle(`${TOOLS[tool].title}: ${input}`),
      type: tool,
    })
    .select("id")
    .single();
  if (convoError || !convo) {
    await ai.body.cancel();
    return jsonError("Could not save this run.", 500);
  }
  const conversationId = convo.id as string;

  const { error: msgError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    user_id: userId,
    role: "user",
    content: content.slice(0, 100_000),
  });
  if (msgError) {
    await ai.body.cancel();
    return jsonError("Could not save this run.", 500);
  }

  const out = passThroughAndSave(ai.body, {
    supabase,
    conversationId,
    userId,
    onError: (err) => logAi(`ai/tool/${tool} stream`, err),
  });

  return new Response(out, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
