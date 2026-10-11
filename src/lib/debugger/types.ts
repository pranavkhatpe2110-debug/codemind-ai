export const DEBUG_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "php",
  "ruby",
  "kotlin",
  "swift",
  "sql",
  "html",
  "css",
  "bash",
] as const;

export const MAX_DEBUG_CODE_CHARS = 50_000;
export const MAX_DEBUG_ERROR_CHARS = 20_000;

export type DebugResult = {
  summary: string;
  cause: string;
  explanation: string;
  fixedCode: string;
  tips: string[];
};
