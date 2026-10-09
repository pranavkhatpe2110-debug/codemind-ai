import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// "server-only" makes the build FAIL if anyone imports this file into browser
// code. That is how we guarantee ANTHROPIC_API_KEY can never reach the browser.

export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "MissingApiKeyError";
  }
}

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new MissingApiKeyError();
  client ??= new Anthropic({ apiKey });
  return client;
}

/** Join all text blocks of a Claude answer into one string. */
export function extractText(message: Anthropic.Message): string {
  let text = "";
  for (const block of message.content) {
    if (block.type === "text") text += block.text;
  }
  return text;
}
