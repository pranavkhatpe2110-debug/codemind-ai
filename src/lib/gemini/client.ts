import "server-only";
import { GoogleGenAI } from "@google/genai";

// "server-only" makes the build FAIL if anyone imports this file into browser
// code. That is how we guarantee GEMINI_API_KEY can never reach the browser.

/** Change the model by editing GEMINI_MODEL in .env.local. No code change needed. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

export class MissingGeminiKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not set");
    this.name = "MissingGeminiKeyError";
  }
}

let client: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new MissingGeminiKeyError();
  client ??= new GoogleGenAI({ apiKey });
  return client;
}
