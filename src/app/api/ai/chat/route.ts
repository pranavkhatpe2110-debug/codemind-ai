import { streamAiText, toAiFailure, logAi } from "@/lib/ai/provider";
import type { ChatMessage } from "@/lib/ai/types";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/anthropic/prompts";
import { guardAiRequest, jsonError } from "@/lib/api/guard";
import {
  MAX_HISTORY_CHARS,
  MAX_HISTORY_MESSAGES,
  MAX_USER_MESSAGE_CHARS,
  makeTitle,
} from "@/lib/assistant/limits";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Allow up to 60 seconds, so a long AI answer is not cut off on Vercel.
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The Assistant chat. Steps:
//  1. check login + rate limit + body (guardAiRequest)
//  2. load the earlier messages from OUR database (never trust the browser)
//  3. ask the AI, streaming the answer to the browser
//  4. save the user message and the AI answer (RLS: only this user's rows)
export async function POST(request: Request) {
  const guard = await guardAiRequest(request);
  if (!guard.ok) return guard.response;

  const body = (guard.body ?? {}) as { conversationId?: unknown; message?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return jsonError("Please type a message.", 400);
  if (message.length > MAX_USER_MESSAGE_CHARS) {
    return jsonError("That message is too long. Please shorten it.", 413);
  }

  let conversationId: string | null = null;
  if (body.conversationId !== undefined && body.conversationId !== null) {
    if (typeof body.conversationId !== "string" || !UUID.test(body.conversationId)) {
      return jsonError("Invalid conversation.", 400);
    }
    conversationId = body.conversationId;
  }

  const supabase = await createClient();
  const userId = guard.user.id;

  // 2. History (RLS makes sure only the owner can read it)
  let history: ChatMessage[] = [];
  if (conversationId) {
    const { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!convo) return jsonError("Conversation not found.", 404);

    const { data: rows, error } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY_MESSAGES);
    if (error) return jsonError("Could not load the conversation.", 500);

    const picked: ChatMessage[] = [];
    let chars = 0;
    for (const r of rows ?? []) {
      if (r.role !== "user" && r.role !== "assistant") continue;
      chars += r.content.length;
      if (chars > MAX_HISTORY_CHARS) break;
      picked.unshift({ role: r.role, content: r.content });
    }
    // The AI wants the first message to be from the user.
    while (picked.length > 0 && picked[0].role !== "user") picked.shift();
    history = picked;
  }

  // 3. Ask the AI. Errors (wrong key, limit...) are thrown here, before anything is saved.
  let aiResponse: Response;
  try {
    aiResponse = await streamAiText({
      system: ASSISTANT_SYSTEM_PROMPT,
      messages: [...history, { role: "user", content: message }],
      maxTokens: 4096,
      signal: request.signal,
    });
  } catch (err) {
    logAi("ai/chat", err);
    const failure = toAiFailure(err);
    return jsonError(failure.message, failure.status);
  }

  // 4a. Save the conversation (if new) and the user's message.
  if (!conversationId) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title: makeTitle(message), type: "assistant" })
      .select("id")
      .single();
    if (error || !created) {
      await aiResponse.body?.cancel();
      return jsonError("Could not save the conversation.", 500);
    }
    conversationId = created.id as string;
  }
  const convoId = conversationId;

  const { error: userSaveError } = await supabase.from("messages").insert({
    conversation_id: convoId,
    user_id: userId,
    role: "user",
    content: message,
  });
  if (userSaveError) {
    await aiResponse.body?.cancel();
    return jsonError("Could not save your message.", 500);
  }

  // 4b. Pass the answer through to the browser while collecting it, then save it.
  const source = aiResponse.body;
  if (!source) return jsonError("The AI returned nothing.", 502);
  const reader = source.getReader();
  const decoder = new TextDecoder();
  let answer = "";
  let saved = false;

  async function saveAnswer() {
    if (saved) return;
    saved = true;
    const text = answer.trim();
    if (!text) return;
    const { error } = await supabase.from("messages").insert({
      conversation_id: convoId,
      user_id: userId,
      role: "assistant",
      content: text.slice(0, 100_000),
    });
    if (error) console.error("[ai/chat] could not save answer", error.message);
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convoId);
  }

  const out = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          answer += decoder.decode();
          await saveAnswer();
          controller.close();
          return;
        }
        answer += decoder.decode(value, { stream: true });
        controller.enqueue(value);
      } catch (err) {
        logAi("ai/chat stream", err);
        await saveAnswer(); // keep whatever arrived before the error
        controller.error(err);
      }
    },
    async cancel() {
      // The user pressed Stop or closed the tab: keep the partial answer.
      await saveAnswer();
      await reader.cancel().catch(() => {});
    },
  });

  return new Response(out, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
      "X-Conversation-Id": convoId,
    },
  });
}
