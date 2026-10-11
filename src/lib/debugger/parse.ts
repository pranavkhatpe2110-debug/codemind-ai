import type { DebugResult } from "./types";

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

/**
 * The AI is asked for JSON, but models sometimes wrap it in ```json fences or
 * add a sentence around it. This finds the JSON and checks its shape, so the
 * page never receives something unexpected.
 */
export function parseDebugResult(raw: string): DebugResult | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  let data: unknown;
  try {
    data = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const o = data as Record<string, unknown>;

  const result: DebugResult = {
    summary: str(o.summary, 500),
    cause: str(o.cause, 4000),
    explanation: str(o.explanation, 8000),
    fixedCode: str(o.fixedCode, 100_000),
    tips: Array.isArray(o.tips)
      ? o.tips.filter((t): t is string => typeof t === "string").slice(0, 6).map((t) => t.slice(0, 500))
      : [],
  };
  if (!result.summary && !result.cause && !result.fixedCode) return null;
  return result;
}
