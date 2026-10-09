export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AiRequest = {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  /** Pass request.signal so the AI stops when the user closes the tab. */
  signal?: AbortSignal;
};

export type ApiFailure = { status: number; message: string };
