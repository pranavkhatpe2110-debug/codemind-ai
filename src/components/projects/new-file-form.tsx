"use client";

import { useActionState } from "react";
import { FilePlus2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createFile, type FormState } from "@/lib/projects/actions";

export function NewFileForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createFile, {});
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex gap-1">
        <input
          name="path"
          required
          maxLength={255}
          placeholder="main.py"
          aria-label="New file name"
          className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="icon" disabled={pending} aria-label="Create file" className="size-9 shrink-0">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
        </Button>
      </div>
      {state.error && <p className="px-1 text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
