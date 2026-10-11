export const HISTORY_TYPES = [
  "assistant",
  "explain",
  "fix",
  "generate",
  "optimize",
  "debug",
] as const;
export type HistoryType = (typeof HISTORY_TYPES)[number];

export const TYPE_LABELS: Record<HistoryType, string> = {
  assistant: "Chat",
  explain: "Explain",
  fix: "Fix",
  generate: "Generate",
  optimize: "Optimize",
  debug: "Debugger",
};

export function isHistoryType(v: unknown): v is HistoryType {
  return typeof v === "string" && (HISTORY_TYPES as readonly string[]).includes(v);
}

export type HistoryItem = {
  kind: "c" | "d"; // c = conversation, d = debug session
  id: string;
  type: HistoryType | "other";
  title: string;
  at: string; // ISO date used for sorting
  extra?: string; // e.g. language, status
};
