"use client";

import { useEffect, useState } from "react";
import { Copy, Eraser, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_LANGUAGE,
  getSample,
  isLanguageId,
} from "@/lib/languages";
import { CodeEditor } from "./code-editor";
import { LanguageSelect } from "./language-select";

const STORAGE_KEY = "codemind:editor-draft";

export function EditorWorkspace({
  defaultLanguage,
  fontSize,
}: {
  defaultLanguage?: string;
  fontSize?: number;
} = {}) {
  const startLanguage = isLanguageId(defaultLanguage) ? defaultLanguage : DEFAULT_LANGUAGE;
  const [language, setLanguage] = useState(startLanguage);
  const [code, setCode] = useState(getSample(startLanguage));
  const [loaded, setLoaded] = useState(false);

  // Restore the draft saved in this browser (if any).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { language?: unknown; code?: unknown };
        if (isLanguageId(draft.language) && typeof draft.code === "string") {
          setLanguage(draft.language);
          setCode(draft.code);
        }
      }
    } catch {
      // Storage can be blocked (private window). The editor still works.
    }
    setLoaded(true);
  }, []);

  // Save the draft shortly after the user stops typing.
  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ language, code }));
      } catch {
        // ignore
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [language, code, loaded]);

  function handleLanguageChange(next: string) {
    // If the user has not written their own code, show a sample for the new language.
    const untouched = code.trim() === "" || code === getSample(language);
    setLanguage(next);
    if (untouched) setCode(getSample(next));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard");
    } catch {
      toast.error("Could not copy. Select the code and press Ctrl+C.");
    }
  }

  const lineCount = code === "" ? 0 : code.split("\n").length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="language" className="text-muted-foreground">
            Language
          </Label>
          <LanguageSelect
            id="language"
            value={language}
            onChange={handleLanguageChange}
          />
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCode(getSample(language))}
          >
            <RotateCcw className="h-4 w-4" />
            Sample
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCode("")}>
            <Eraser className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="h-[60vh] min-h-[320px] overflow-hidden rounded-xl border">
        <CodeEditor value={code} onChange={setCode} language={language} fontSize={fontSize} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {lineCount} {lineCount === 1 ? "line" : "lines"} · {code.length}{" "}
          characters
        </span>
        <span>Draft is saved automatically in this browser.</span>
      </div>
    </div>
  );
}
