import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import { PageHeader } from "@/components/page-header";
import { getUserSettings } from "@/lib/settings/data";

export const metadata: Metadata = { title: "Code Editor" };

export default async function EditorPage() {
  const settings = await getUserSettings();
  return (
    <>
      <PageHeader
        title="Code Editor"
        description="Write or paste code in a full-featured editor. Syntax colors, line numbers and dark / light themes are built in."
      />
      <EditorWorkspace
        defaultLanguage={settings.default_language}
        fontSize={settings.editor_font_size}
      />
      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Your code is never run on our servers. The editor only edits text.
      </p>
    </>
  );
}
