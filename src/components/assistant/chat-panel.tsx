"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, SendHorizontal, Square, TriangleAlert, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageContent } from "./message-content";

export type UiMessage = { id: string; role: "user" | "assistant"; content: string };

const MAX_CHARS = 20_000;

const SUGGESTIONS = [
  "Explain what a for loop is, with a small Python example.",
  "Why does my JavaScript say 'undefined is not a function'?",
  "Write a function that reverses a string in TypeScript.",
];

export function ChatPanel({
  conversationId,
  initialMessages,
}: {
  conversationId: string | null;
  initialMessages: UiMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setError(null);
    setInput("");
    setBusy(true);

    const userMsg: UiMessage = { id: `u-${Date.now()}`, role: "user", content: message };
    const aiId = `a-${Date.now()}`;
    setMessages((m) => [...m, userMsg, { id: aiId, role: "assistant", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;
    let newId: string | null = null;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? `Request failed (${res.status}).`);
        setMessages((m) => m.filter((x) => x.id !== aiId && x.id !== userMsg.id));
        setInput(message);
        return;
      }

      if (!conversationId) newId = res.headers.get("X-Conversation-Id");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === aiId ? { ...x, content: text } : x)));
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") {
        setError("The connection was lost. Your message may have been saved. Refresh to check.");
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
      if (newId) router.replace(`/assistant?c=${newId}`);
      router.refresh();
    }
  }

  return (
    <section className="flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-10 text-center">
            <Bot className="size-8 text-primary" />
            <p className="text-sm text-muted-foreground">
              Ask a coding question, paste an error, or ask for a function. Try one:
            </p>
            <div className="flex w-full flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-lg border px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  m.role === "user" ? "bg-primary/15" : "bg-muted/50"
                }`}
              >
                {m.content ? (
                  <MessageContent content={m.content} />
                ) : (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2 border-t p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={2}
          placeholder="Ask about code... (Enter to send, Shift+Enter for a new line)"
          aria-label="Your message"
          className="max-h-40 min-h-[44px] flex-1 resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {busy ? (
          <Button type="button" variant="outline" onClick={() => abortRef.current?.abort()}>
            <Square className="size-4" /> Stop
          </Button>
        ) : (
          <Button type="submit" disabled={!input.trim()}>
            <SendHorizontal className="size-4" /> Send
          </Button>
        )}
      </form>
    </section>
  );
}
