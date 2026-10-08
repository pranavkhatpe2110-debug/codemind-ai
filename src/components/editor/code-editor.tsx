"use client";

import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";

export type CodeEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  /** A Monaco language id, e.g. "python". See src/lib/languages.ts */
  language: string;
  height?: string | number;
  readOnly?: boolean;
  fontSize?: number;
};

/**
 * Reusable code editor (Monaco, the editor that powers VS Code).
 * It follows the app's dark / light theme automatically.
 * We reuse it in the Debugger, Explain / Fix tools and Projects.
 */
export function CodeEditor({
  value,
  onChange,
  language,
  height = "100%",
  readOnly = false,
  fontSize = 14,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme={resolvedTheme === "light" ? "light" : "vs-dark"}
      onChange={(next) => onChange?.(next ?? "")}
      loading={<Skeleton className="h-full w-full rounded-none" />}
      options={{
        readOnly,
        fontSize,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: "on",
        padding: { top: 12, bottom: 12 },
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        fixedOverflowWidgets: true,
      }}
    />
  );
}
