"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/auth/actions";
import type { FormState } from "@/lib/auth/types";
import { FormMessage } from "./form-message";

const initialState: FormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPassword,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
