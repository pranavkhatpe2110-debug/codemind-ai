"use client";

import { useState } from "react";
import { Bug, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/assistant/message-content";
import {
  DEBUG_LANGUAGES,
  MAX_DEBUG_CODE_CHARS,
  MAX_DEBUG_ERROR_CHARS,
  type DebugResult,
} from "@/lib/debugger/types";

type Initial = {
  language: string;
  code: string;
  errorMessage: string;
  result: DebugResult | null;
} | null;

export function DebuggerPanel({
  initial,
  defaultLanguage,
}: {
  initial: Initial;
  defaultLanguage?: string;
}) {
  const fallback =
    defaultLanguage && (DEBUG_LANGUAGES as readonly string[]).includes(defaultLanguage)
      ? defaultLanguage
      : "javascript";
  const [language, setLanguage] = useState(initial?.language ?? fallback);
  const [code, setCode] = useState(initial?.code ?? "");
  const [errorMessage, setErrorMessage] = useState(initial?.errorMessage ?? "");
  const [result, setResult] = useState<DebugResult | null>(initial?.result ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyse() {
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, errorMessage }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; result: DebugResult }
        | { ok: false; error?: string }
        | null;
      if (!res.ok || !data || !("result" in data)) {
        setError((data && "error" in data && data.error) || `Request failed (${res.status}).`);
        return;
      }
      setResult(data.result);
    } catch {
      setError("Could not reach the server. Is the app still running?");
    } finally {
      setBusy(false);
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
          Your code
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, MAX_DEBUG_CODE_CHARS))}
            rows={12}
            spellCheck={false}
            placeholder="Paste the code that does not work..."
            className={`${field} min-h-[180px] resize-y`}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Error message (optional)
          <textarea
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value.slice(0, MAX_DEBUG_ERROR_CHARS))}
            rows={4}
            spellCheck={false}
            placeholder="Paste the error you see, or describe what goes wrong..."
            className={`${field} resize-y`}
          />
        </label>

        <div>
          <Button onClick={analyse} disabled={busy || !code.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Bug className="size-4" />}
            {busy ? "Analysing..." : "Find the bug"}
          </Button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm leading-relaxed">
          {result.summary && <h2 className="text-base font-semibold">{result.summary}</h2>}
          {result.cause && (
            <div>
              <h3 className="mb-1 font-medium">Cause</h3>
              <p className="whitespace-pre-wrap break-words">{result.cause}</p>
            </div>
          )}
          {result.explanation && (
            <div>
              <h3 className="mb-1 font-medium">Explanation</h3>
              <p className="whitespace-pre-wrap break-words">{result.explanation}</p>
            </div>
          )}
          {result.fixedCode && (
            <div>
              <h3 className="mb-1 font-medium">Fixed code</h3>
              <CodeBlock lang={language} code={result.fixedCode} />
            </div>
          )}
          {result.tips.length > 0 && (
            <div>
              <h3 className="mb-1 font-medium">Tips</h3>
              <ul className="list-disc space-y-1 pl-5">
                {result.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            The AI cannot run your code, so test the fix yourself before using it.
          </p>
        </section>
      )}
    </div>
  );
}
