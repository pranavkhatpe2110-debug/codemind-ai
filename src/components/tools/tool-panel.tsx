"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Square, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageContent } from "@/components/assistant/message-content";
import { DEBUG_LANGUAGES } from "@/lib/debugger/types";
import {
  MAX_TOOL_EXTRA_CHARS,
  MAX_TOOL_INPUT_CHARS,
  TOOLS,
  type ToolId,
} from "@/lib/tools/config";

export function ToolPanel({ tool, defaultLanguage }: { tool: ToolId; defaultLanguage?: string }) {
  const info = TOOLS[tool];
  const [language, setLanguage] = useState(
    defaultLanguage && (DEBUG_LANGUAGES as readonly string[]).includes(defaultLanguage)
      ? defaultLanguage
      : "javascript",
  );
  const [input, setInput] = useState("");
  const [extra, setExtra] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function run() {
    if (busy || !input.trim()) return;
    setBusy(true);
    setError(null);
    setOutput("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/ai/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, language, input, extra }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? `Request failed (${res.status}).`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setOutput(text);
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") {
        setError("The connection was lost. Please try again.");
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const field =
    "w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <label className="flex flex-col gap-1 text-sm">
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-9 w-48 rounded-lg border bg-background px-2 text-sm"
          >
            {DEBUG_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {info.inputLabel}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_TOOL_INPUT_CHARS))}
            rows={tool === "generate" ? 5 : 12}
            spellCheck={false}
            placeholder={info.inputPlaceholder}
            className={`${field} ${tool === "generate" ? "min-h-[110px]" : "min-h-[180px]"} resize-y`}
          />
        </label>

        {info.extraLabel && (
          <label className="flex flex-col gap-1 text-sm">
            {info.extraLabel}
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value.slice(0, MAX_TOOL_EXTRA_CHARS))}
              rows={3}
              spellCheck={false}
              placeholder={info.extraPlaceholder}
              className={`${field} resize-y`}
            />
          </label>
        )}

        <div className="flex gap-2">
          {busy ? (
            <Button variant="outline" onClick={() => abortRef.current?.abort()}>
              <Square className="size-4" /> Stop
            </Button>
          ) : (
            <Button onClick={run} disabled={!input.trim()}>
              <Sparkles className="size-4" /> {info.button}
            </Button>
          )}
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      )}

      {(output || busy) && (
        <section className="rounded-xl border bg-card p-4">
          {output ? (
            <MessageContent content={output} />
          ) : (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
          {output && !busy && (
            <p className="mt-3 text-xs text-muted-foreground">
              The AI cannot run your code, so test the result yourself before using it.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
