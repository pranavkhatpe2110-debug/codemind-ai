import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Passes an AI answer through to the browser while collecting it, then saves
 * it as the "assistant" message of a conversation. If the user presses Stop,
 * the part that arrived is still saved.
 */
export function passThroughAndSave(
  source: ReadableStream<Uint8Array>,
  opts: {
    supabase: SupabaseClient;
    conversationId: string;
    userId: string;
    onError?: (err: unknown) => void;
  },
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  let answer = "";
  let saved = false;

  async function save() {
    if (saved) return;
    saved = true;
    const text = answer.trim();
    if (!text) return;
    const { error } = await opts.supabase.from("messages").insert({
      conversation_id: opts.conversationId,
      user_id: opts.userId,
      role: "assistant",
      content: text.slice(0, 100_000),
    });
    if (error) console.error("[tools] could not save answer", error.message);
    await opts.supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", opts.conversationId);
  }

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          answer += decoder.decode();
          await save();
          controller.close();
          return;
        }
        answer += decoder.decode(value, { stream: true });
        controller.enqueue(value);
      } catch (err) {
        opts.onError?.(err);
        await save();
        controller.error(err);
      }
    },
    async cancel() {
      await save();
      await reader.cancel().catch(() => {});
    },
  });
}
