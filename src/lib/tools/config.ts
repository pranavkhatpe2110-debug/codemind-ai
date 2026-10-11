// The four code tools. One list, used by the page, the API and the prompts.
export const TOOL_IDS = ["explain", "fix", "generate", "optimize"] as const;
export type ToolId = (typeof TOOL_IDS)[number];

export function isToolId(v: unknown): v is ToolId {
  return typeof v === "string" && (TOOL_IDS as readonly string[]).includes(v);
}

export type ToolInfo = {
  title: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  extraLabel?: string;
  extraPlaceholder?: string;
  button: string;
};

export const TOOLS: Record<ToolId, ToolInfo> = {
  explain: {
    title: "Explain Code",
    description: "Paste code and get a clear, step by step explanation for beginners.",
    inputLabel: "Code to explain",
    inputPlaceholder: "Paste the code you want to understand...",
    button: "Explain",
  },
  fix: {
    title: "Fix Code",
    description: "Paste broken code. The AI fixes it and tells you what changed.",
    inputLabel: "Broken code",
    inputPlaceholder: "Paste the code that does not work...",
    extraLabel: "Error message (optional)",
    extraPlaceholder: "Paste the error, or describe what goes wrong...",
    button: "Fix it",
  },
  generate: {
    title: "Generate Code",
    description: "Describe what you want in plain words and get working code.",
    inputLabel: "What should the code do?",
    inputPlaceholder: "Example: a function that checks if a number is prime...",
    button: "Generate",
  },
  optimize: {
    title: "Optimize Code",
    description: "Make code faster, shorter or cleaner, with the reasons explained.",
    inputLabel: "Code to optimize",
    inputPlaceholder: "Paste the code you want to improve...",
    extraLabel: "Goal (optional)",
    extraPlaceholder: "Example: make it faster, or easier to read...",
    button: "Optimize",
  },
};

export const MAX_TOOL_INPUT_CHARS = 50_000;
export const MAX_TOOL_EXTRA_CHARS = 20_000;
