"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Mode = "normal" | "stream";
type Result =
  | { kind: "success"; text: string; model?: string; provider?: string }
  | { kind: "error"; message: string };

export function AiTest() {
  const [loading, setLoading] = useState<Mode | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run(mode: Mode) {
    setLoading(mode);
    setResult(null);
    try {
      const res = await fetch("/api/ai/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setResult({
          kind: "error",
          message: data?.error ?? `Request failed (${res.status}).`,
        });
        return;
      }

      if (mode === "stream") {
        if (!res.body) {
          setResult({ kind: "error", message: "Streaming is not supported here." });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setResult({ kind: "success", text });
        }
        text += decoder.decode();
        setResult({ kind: "success", text });
      } else {
        const data = (await res.json()) as {
          reply: string;
          model?: string;
          provider?: string;
        };
        setResult({
          kind: "success",
          text: data.reply,
          model: data.model,
          provider: data.provider,
        });
      }
    } catch {
      setResult({
        kind: "error",
        message: "Could not reach the server. Is the app still running?",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Test the AI connection</CardTitle>
        <CardDescription>
          Each test sends one tiny message to the AI from the server. It uses a
          very small part of your free quota (or API credit).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => run("normal")} disabled={loading !== null}>
            {loading === "normal" && <Loader2 className="h-4 w-4 animate-spin" />}
            Test connection
          </Button>
          <Button
            variant="outline"
            onClick={() => run("stream")}
            disabled={loading !== null}
          >
            {loading === "stream" && <Loader2 className="h-4 w-4 animate-spin" />}
            Test streaming
          </Button>
        </div>

        {result?.kind === "success" && (
          <div
            role="status"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4"
          >
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
              The AI replied
              {result.model && (
                <span className="font-mono text-xs opacity-80">
                  ({result.provider ? `${result.provider} · ` : ""}
                  {result.model})
                </span>
              )}
            </p>
            <pre className="whitespace-pre-wrap text-sm">{result.text}</pre>
          </div>
        )}

        {result?.kind === "error" && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-500"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
