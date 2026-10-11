"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// A tiny, safe renderer: ```code blocks``` and `inline code`.
// Everything is rendered as plain text by React (no raw HTML), so an AI answer
// can never inject scripts into the page.

type Part = { kind: "text"; text: string } | { kind: "code"; lang: string; code: string };

function split(content: string): Part[] {
  const parts: Part[] = [];
  const re = /```([\w+#.-]*)[^\S\n]*\n([\s\S]*?)(?:```|$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push({ kind: "text", text: content.slice(last, m.index) });
    parts.push({ kind: "code", lang: m[1] || "code", code: m[2].replace(/\n$/, "") });
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  if (last < content.length) parts.push({ kind: "text", text: content.slice(last) });
  return parts;
}

function Inline({ text }: { text: string }) {
  const pieces = text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g);
  return (
    <>
      {pieces.map((p, i) => {
        if (p.startsWith("`") && p.endsWith("`") && p.length > 2)
          return (
            <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
              {p.slice(1, -1)}
            </code>
          );
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4)
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: ignore
    }
  }
  return (
    <div className="my-2 overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
        <span>{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

export function MessageContent({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed">
      {split(content).map((p, i) =>
        p.kind === "code" ? (
          <CodeBlock key={i} lang={p.lang} code={p.code} />
        ) : (
          <p key={i} className="whitespace-pre-wrap break-words">
            <Inline text={p.text} />
          </p>
        ),
      )}
    </div>
  );
}
