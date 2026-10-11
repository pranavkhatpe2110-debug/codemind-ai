"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLanguageId } from "@/lib/languages";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_FILE_CONTENT,
  MAX_PROJECT_DESCRIPTION,
  MAX_PROJECT_NAME,
  UUID,
  cleanFilePath,
  languageForPath,
} from "./validate";

export type FormState = { error?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function text(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

// Every query also filters by user_id. RLS in the database checks it again.

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const name = text(formData, "name").trim();
  const description = text(formData, "description").trim();

  if (!name) return { error: "Please give your project a name." };
  if (name.length > MAX_PROJECT_NAME) return { error: `The name is too long (max ${MAX_PROJECT_NAME}).` };
  if (description.length > MAX_PROJECT_DESCRIPTION) {
    return { error: `The description is too long (max ${MAX_PROJECT_DESCRIPTION}).` };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, name, description })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not create the project. Please try again." };

  revalidatePath("/projects");
  return redirect(`/projects/${data.id}`);
}

export async function deleteProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = text(formData, "id");
  if (!UUID.test(id)) return;

  // Delete the files first so this works even without "cascade" in the database.
  await supabase.from("project_files").delete().eq("project_id", id).eq("user_id", user.id);
  await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/projects");
  redirect("/projects");
}

export async function createFile(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const projectId = text(formData, "projectId");
  if (!UUID.test(projectId)) return { error: "Invalid project." };

  const cleaned = cleanFilePath(text(formData, "path"));
  if (!cleaned.ok) return { error: cleaned.error };

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) return { error: "Project not found." };

  const { data, error } = await supabase
    .from("project_files")
    .insert({
      project_id: projectId,
      user_id: user.id,
      path: cleaned.path,
      language: languageForPath(cleaned.path),
      content: "",
    })
    .select("id")
    .single();

  if (error || !data) {
    // 23505 = the unique rule (project_id, path): the name is already used
    if (error?.code === "23505") return { error: "A file with that name already exists." };
    return { error: "Could not create the file. Please try again." };
  }

  revalidatePath(`/projects/${projectId}`);
  return redirect(`/projects/${projectId}?f=${data.id}`);
}

export async function deleteFile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = text(formData, "id");
  const projectId = text(formData, "projectId");
  if (!UUID.test(id) || !UUID.test(projectId)) return;

  await supabase.from("project_files").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

/** Called from the editor's Save button. Returns a result instead of redirecting. */
export async function saveFile(input: {
  projectId: string;
  fileId: string;
  content: string;
  language: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, user } = await requireUser();
  const { projectId, fileId, content, language } = input;

  if (!UUID.test(projectId) || !UUID.test(fileId)) return { ok: false, error: "Invalid file." };
  if (typeof content !== "string" || content.length > MAX_FILE_CONTENT) {
    return { ok: false, error: `The file is too big (max ${MAX_FILE_CONTENT} characters).` };
  }
  if (!isLanguageId(language)) return { ok: false, error: "Invalid language." };

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("project_files")
    .update({ content, language, updated_at: now })
    .eq("id", fileId)
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: "Could not save. Please try again." };
  if (!data) return { ok: false, error: "File not found. It may have been deleted." };

  await supabase.from("projects").update({ updated_at: now }).eq("id", projectId).eq("user_id", user.id);
  return { ok: true };
}
