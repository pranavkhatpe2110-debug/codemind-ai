"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Save, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/editor/code-editor";
import { LANGUAGES } from "@/lib/languages";
import { saveFile } from "@/lib/projects/actions";

type Props = {
  fontSize?: number;
  projectId: string;
  file: { id: string; path: string; language: string; content: string };
};

export function FileEditor({ projectId, file, fontSize }: Props) {
  const [content, setContent] = useState(file.content);
  const [language, setLanguage] = useState(file.language);
  const [saved, setSaved] = useState({ content: file.content, language: file.language });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const dirty = content !== saved.content || language !== saved.language;

  async function save() {
    if (status === "saving" || !dirty) return;
    setStatus("saving");
    setError(null);
    const snapshot = { content, language };
    try {
      const res = await saveFile({ projectId, fileId: file.id, ...snapshot });
      if (res.ok) {
        setSaved(snapshot);
        setStatus("saved");
      } else {
        setError(res.error);
        setStatus("error");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setStatus("error");
    }
  }

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  return (
    <div
      className="flex h-[calc(100dvh-14rem)] min-h-[380px] flex-col overflow-hidden rounded-xl border bg-card"
      onKeyDownCapture={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          void save();
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-sm" title={file.path}>
          {file.path}
          {dirty && <span className="ml-1 text-muted-foreground">(unsaved)</span>}
        </span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label="Language"
          className="h-8 rounded-lg border bg-background px-2 text-xs"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={save} disabled={!dirty || status === "saving"}>
          {status === "saving" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : status === "saved" && !dirty ? (
            <Check className="size-4" />
          ) : (
            <Save className="size-4" />
          )}
          {status === "saved" && !dirty ? "Saved" : "Save"}
        </Button>
      </div>
      {error && (
        <div className="flex items-start gap-2 border-b border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <CodeEditor value={content} onChange={setContent} language={language} fontSize={fontSize} />
      </div>
    </div>
  );
}
