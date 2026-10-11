import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileCode2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/projects/confirm-form";
import { FileEditor } from "@/components/projects/file-editor";
import { NewFileForm } from "@/components/projects/new-file-form";
import { deleteFile } from "@/lib/projects/actions";
import { UUID } from "@/lib/projects/validate";
import { getUserSettings } from "@/lib/settings/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Project" };

type OpenFile = { id: string; path: string; language: string; content: string };

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ f?: string }>;
}) {
  const { id } = await params;
  const { f } = await searchParams;
  if (!UUID.test(id)) return notFound();

  const settings = await getUserSettings();
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description")
    .eq("id", id)
    .maybeSingle();
  if (!project) return notFound();

  const { data: fileRows } = await supabase
    .from("project_files")
    .select("id, path, language")
    .eq("project_id", id)
    .order("path", { ascending: true })
    .limit(500);
  const files = (fileRows ?? []) as { id: string; path: string; language: string }[];

  const wanted = f && UUID.test(f) ? f : files[0]?.id;
  let current: OpenFile | null = null as OpenFile | null;
  if (wanted && files.some((x) => x.id === wanted)) {
    const { data } = await supabase
      .from("project_files")
      .select("id, path, language, content")
      .eq("id", wanted)
      .eq("project_id", id)
      .maybeSingle();
    current = data as OpenFile | null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/projects"
          className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All projects
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="flex h-fit flex-col gap-2 rounded-xl border bg-card p-2">
          <NewFileForm projectId={id} />
          <div className="max-h-64 space-y-1 overflow-y-auto lg:max-h-[calc(100dvh-20rem)]">
            {files.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                No files yet. Type a name above, like main.py, and press the + button.
              </p>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-1 rounded-lg ${
                    file.id === current?.id ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  <Link
                    href={`/projects/${id}?f=${file.id}`}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-sm"
                    title={file.path}
                  >
                    <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.path}</span>
                  </Link>
                  <ConfirmForm action={deleteFile} message={`Delete ${file.path}? This cannot be undone.`}>
                    <input type="hidden" name="id" value={file.id} />
                    <input type="hidden" name="projectId" value={id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete file ${file.path}`}
                      className="size-7 shrink-0 opacity-60 hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </ConfirmForm>
                </div>
              ))
            )}
          </div>
        </aside>

        {current ? (
          <FileEditor key={current.id} projectId={id} file={current} fontSize={settings.editor_font_size} />
        ) : (
          <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            Create or select a file to start editing.
          </div>
        )}
      </div>
    </div>
  );
}
