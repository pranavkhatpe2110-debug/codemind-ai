import "server-only";
import type { AiRequest } from "@/lib/ai/types";

// Works with any "OpenAI-compatible" service: Groq, OpenRouter, and others.
// Settings (all in .env.local, server-side only):
//   OPENAI_COMPAT_BASE_URL  e.g. https://api.groq.com/openai/v1
//   OPENAI_COMPAT_API_KEY   your key from that service
//   OPENAI_COMPAT_MODEL     a model name from that service

export class MissingCompatConfigError extends Error {
  constructor(what: string) {
    super(`${what} is not set`);
    this.name = "MissingCompatConfigError";
  }
}

export class CompatHttpError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.name = "CompatHttpError";
    this.status = status;
  }
}

export function getCompatConfig() {
  const apiKey = process.env.OPENAI_COMPAT_API_KEY?.trim();
  const model = process.env.OPENAI_COMPAT_MODEL?.trim();
  const base = (
    process.env.OPENAI_COMPAT_BASE_URL?.trim() || "https://api.groq.com/openai/v1"
  ).replace(/\/+$/, "");
  if (!apiKey) throw new MissingCompatConfigError("OPENAI_COMPAT_API_KEY");
  if (!model) throw new MissingCompatConfigError("OPENAI_COMPAT_MODEL");
  return { apiKey, model, base, url: `${base}/chat/completions` };
}

async function post(req: AiRequest, stream: boolean) {
  const { apiKey, model, base, url } = getCompatConfig();
  // OpenAI's newer models want "max_completion_tokens"; other services use "max_tokens".
  const limitField = base.includes("api.openai.com") ? "max_completion_tokens" : "max_tokens";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream,
      [limitField]: Math.min(req.maxTokens ?? 4096, 4096),
      messages: [{ role: "system", content: req.system }, ...req.messages],
    }),
    signal: req.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new CompatHttpError(res.status, text.slice(0, 500));
  }
  return { res, model };
}

export async function compatGenerate(req: AiRequest) {
  const { res, model } = await post(req, false);
  const data = (await res.json()) as {
    model?: string;
    choices?: { message?: { content?: string | null } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return { text, model: data.model ?? model };
}

/** Reads the server-sent events ("data: {...}" lines) and yields the text. */
export async function* compatChunks(
  req: AiRequest,
): AsyncGenerator<string, void, undefined> {
  const { res } = await post(req, true);
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string | null } }[];
          };
          const piece = json.choices?.[0]?.delta?.content;
          if (piece) yield piece;
        } catch {
          // ignore keep-alive / partial lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
