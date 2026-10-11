import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPanel } from "@/components/tools/tool-panel";
import { getUserSettings } from "@/lib/settings/data";
import { TOOLS, isToolId } from "@/lib/tools/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  return { title: isToolId(tool) ? TOOLS[tool].title : "Tool" };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  if (!isToolId(tool)) return notFound();
  const info = TOOLS[tool];
  const settings = await getUserSettings();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{info.title}</h1>
        <p className="text-sm text-muted-foreground">
          {info.description} Your code is only read by the AI. It is never run.
        </p>
      </div>
      <ToolPanel key={tool} tool={tool} defaultLanguage={settings.default_language} />
    </div>
  );
}
