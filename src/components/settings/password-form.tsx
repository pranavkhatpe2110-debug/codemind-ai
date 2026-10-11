"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changePassword, type SettingsState } from "@/lib/settings/actions";
import { Status, fieldClass } from "./status";

export function PasswordForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(changePassword, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.stamp, state.ok]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold">Change password</h2>
      <label className="flex flex-col gap-1 text-sm">
        Current password
        <input name="currentPassword" type="password" autoComplete="current-password" required className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        New password (at least 8 characters)
        <input name="newPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Repeat new password
        <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className={fieldClass} />
      </label>
      <Status state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Change password
        </Button>
      </div>
    </form>
  );
}
