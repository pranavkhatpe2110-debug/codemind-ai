import "server-only";
import type { AiRequest } from "@/lib/ai/types";
import { DEBUG_MARKER } from "@/lib/anthropic/prompts";

// A FAKE AI for testing the app without any key. It does not think; it just
// returns a canned answer so you can build and test the screens.

export const MOCK_MODEL = "mock-ai";

function mockDebugAnswer(): string {
  return JSON.stringify({
    summary: "(Mock) Example result: a variable is used before it is defined.",
    cause:
      "This is a FAKE answer from the mock AI. A real AI will read your code and find the real cause.",
    explanation:
      "1. The mock AI does not read your code.\n2. It always returns this same example.\n3. Connect a real AI in .env.local to get real debugging.",
    fixedCode: "function add(a, b) {\n  return a + b;\n}",
    tips: ["Read the error message from the top.", "Test small pieces of code one by one."],
  });
}

function answerFor(req: AiRequest): string {
  if (req.system.includes(DEBUG_MARKER)) return mockDebugAnswer();
  const last = [...req.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (/exactly this sentence/i.test(last)) return "CodeMind AI is connected.";
  if (/count from 1 to 5/i.test(last))
    return "1\n2\n3\n4\n5\n\nKeep going, every bug you fix makes you a better programmer!";
  const preview = last.slice(0, 200).replace(/\s+/g, " ");
  return [
    "**(Mock AI answer, no real AI is connected)**",
    "",
    `You said: "${preview}"`,
    "",
    "Here is an example snippet:",
    "",
    "```js",
    "function add(a, b) {",
    "  return a + b;",
    "}",
    "```",
    "",
    "Switch AI_PROVIDER in .env.local to get real answers.",
  ].join("\n");
}

export async function mockGenerate(req: AiRequest) {
  return { text: answerFor(req), model: MOCK_MODEL };
}

export async function* mockChunks(
  req: AiRequest,
): AsyncGenerator<string, void, undefined> {
  const words = answerFor(req).split(/(\s+)/);
  for (const w of words) {
    if (req.signal?.aborted) return;
    yield w;
    await new Promise((r) => setTimeout(r, 25));
  }
}
