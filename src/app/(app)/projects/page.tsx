import type { Metadata } from "next";
import Link from "next/link";
import { FolderGit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/projects/confirm-form";
import { NewProjectForm } from "@/components/projects/new-project-form";
import { deleteProject } from "@/lib/projects/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Projects" };

type Project = { id: string; name: string; description: string | null; updated_at: string };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, description, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  const projects = (data ?? []) as Project[];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Keep your code files in projects. Only you can see them.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <NewProjectForm />

        <div className="flex flex-col gap-2">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              <FolderGit2 className="size-8" />
              No projects yet. Create your first one.
            </div>
          ) : (
            projects.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border bg-card p-3">
                <Link href={`/projects/${p.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  {p.description && (
                    <p className="truncate text-sm text-muted-foreground">{p.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(p.updated_at).toLocaleDateString("en-IN")}
                  </p>
                </Link>
                <ConfirmForm
                  action={deleteProject}
                  message={`Delete "${p.name}" and all its files? This cannot be undone.`}
                >
                  <input type="hidden" name="id" value={p.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete project ${p.name}`}
                    className="size-8 shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </ConfirmForm>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
