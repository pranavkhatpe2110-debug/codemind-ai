import "server-only";
import { MAX_OUTPUT_TOKENS } from "@/lib/anthropic/config";
import type { AiRequest, ChatMessage } from "@/lib/ai/types";
import { textStreamResponse } from "@/lib/ai/text-stream";
import { GEMINI_MODEL, getGemini } from "./client";

// Gemini calls the assistant's turns "model".
function toContents(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

// Gemini can count its hidden "thinking" inside this limit, so never go too low,
// or the visible answer could come back empty.
function outputLimit(requested?: number) {
  return Math.min(Math.max(requested ?? MAX_OUTPUT_TOKENS, 1024), MAX_OUTPUT_TOKENS);
}

export async function geminiGenerate(
  req: AiRequest,
): Promise<{ text: string; model: string }> {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: toContents(req.messages),
    config: {
      systemInstruction: req.system,
      maxOutputTokens: outputLimit(req.maxTokens),
    },
  });
  return { text: response.text ?? "", model: GEMINI_MODEL };
}

export async function geminiStream(req: AiRequest): Promise<Response> {
  const ai = getGemini();
  const stream = await ai.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: toContents(req.messages),
    config: {
      systemInstruction: req.system,
      maxOutputTokens: outputLimit(req.maxTokens),
    },
  });

  async function* texts(): AsyncGenerator<string, void, undefined> {
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  }

  return textStreamResponse(texts());
}
