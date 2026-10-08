import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileCode2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

async function getProject(id: string) {
  const supabase = await createClient();
  // RLS means this only ever returns the signed-in user's own project.
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string; name: string; description: string | null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return notFound();

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description ?? "No description yet."}
        actions={
          <Link
            href="/projects"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="h-4 w-4" />
            All projects
          </Link>
        }
      />
      <EmptyState
        icon={FileCode2}
        title="Files and the editor are coming soon"
        description="Adding, editing and saving files in this project arrives in Phase 11."
      />
    </>
  );
}
