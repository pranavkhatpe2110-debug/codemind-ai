// Settings for every Claude call. Server-side only.

/** Change the model by editing ANTHROPIC_MODEL in .env.local. No code change needed. */
export const AI_MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5-5";

/** Upper limit for the length of one Claude answer (protects your wallet). */
export const MAX_OUTPUT_TOKENS = 4096;

/** Largest request body we accept from the browser, in characters. */
export const MAX_REQUEST_CHARS = 200_000;
