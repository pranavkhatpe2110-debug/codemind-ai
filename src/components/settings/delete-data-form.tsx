"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMyData, type SettingsState } from "@/lib/settings/actions";
import { Status, fieldClass } from "./status";

export function DeleteDataForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(deleteMyData, {});
  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-card p-4"
      onSubmit={(e) => {
        if (!window.confirm("Delete ALL your chats, debug sessions, projects and files? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <h2 className="text-base font-semibold text-destructive">Danger zone</h2>
      <p className="text-sm text-muted-foreground">
        This deletes all your chats, tool runs, debug sessions, projects and files. Your account,
        profile and settings stay. It cannot be undone.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Type DELETE to confirm
        <input name="confirm" autoComplete="off" placeholder="DELETE" className={fieldClass} />
      </label>
      <Status state={state} />
      <div>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Delete all my data
        </Button>
      </div>
    </form>
  );
}
