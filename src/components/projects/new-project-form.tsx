"use client";

import { useActionState } from "react";
import { Loader2, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createProject, type FormState } from "@/lib/projects/actions";

export function NewProjectForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createProject, {});
  const field =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold">New project</h2>
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input name="name" required maxLength={100} placeholder="My first app" className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Description (optional)
        <textarea
          name="description"
          rows={2}
          maxLength={500}
          placeholder="What is this project about?"
          className={`${field} resize-y`}
        />
      </label>
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span>{state.error}</span>
        </div>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Create project
        </Button>
      </div>
    </form>
  );
}
