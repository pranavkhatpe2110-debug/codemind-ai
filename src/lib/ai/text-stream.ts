import "server-only";

/**
 * Turns a stream of text pieces into a streaming Response, so the answer
 * appears word by word in the browser.
 *
 * It waits for the FIRST piece before answering. If the AI rejects the request
 * (wrong key, no quota...), the error is thrown here, before anything is sent,
 * and the route can return a normal JSON error.
 */
export async function textStreamResponse(
  chunks: AsyncGenerator<string, void, undefined>,
): Promise<Response> {
  let pending: IteratorResult<string, void> | undefined = await chunks.next();
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const result = pending ?? (await chunks.next());
        pending = undefined;
        if (result.done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(result.value));
      } catch (err) {
        controller.error(err);
      }
    },
    async cancel() {
      await chunks.return(undefined);
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
