"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth/actions";
import type { FormState } from "@/lib/auth/types";
import { FormMessage } from "./form-message";

const initialState: FormState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    resetPassword,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving..." : "Save new password"}
      </Button>
    </form>
  );
}
