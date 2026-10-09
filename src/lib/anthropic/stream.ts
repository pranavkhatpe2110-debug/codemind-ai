import "server-only";
import { getAnthropic } from "./client";
import { AI_MODEL, MAX_OUTPUT_TOKENS } from "./config";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type StreamParams = {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  /** Pass request.signal so Claude stops when the user closes the tab. */
  signal?: AbortSignal;
};

/**
 * Asks Claude and returns a streaming Response, so the answer appears word by
 * word in the browser. Used by the Assistant, Debugger and Explain/Fix tools.
 *
 * If Claude rejects the request (wrong key, no credit...), this THROWS before
 * any data is sent. The route then returns a normal JSON error.
 */
export async function streamText(params: StreamParams): Promise<Response> {
  const client = getAnthropic();
  const stream = client.messages.stream(
    {
      model: AI_MODEL,
      max_tokens: Math.min(params.maxTokens ?? MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
      system: params.system,
      messages: params.messages,
    },
    { signal: params.signal },
  );

  const iterator = stream[Symbol.asyncIterator]();
  // Wait for the first event: connection problems surface here.
  let pending: Awaited<ReturnType<typeof iterator.next>> | undefined =
    await iterator.next();

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (true) {
          const result = pending ?? (await iterator.next());
          pending = undefined;
          if (result.done) {
            controller.close();
            return;
          }
          const event = result.value;
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
            return;
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
