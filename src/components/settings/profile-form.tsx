"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfile, type SettingsState } from "@/lib/settings/actions";
import { Status, fieldClass } from "./status";

export function ProfileForm({
  email,
  displayName,
  avatarUrl,
}: {
  email: string;
  displayName: string;
  avatarUrl: string;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateProfile, {});
  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold">Profile</h2>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input value={email} readOnly disabled className={`${fieldClass} opacity-70`} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Display name
        <input name="displayName" defaultValue={displayName} maxLength={100} placeholder="Your name" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Picture link (optional, starts with https://)
        <input name="avatarUrl" defaultValue={avatarUrl} maxLength={500} placeholder="https://..." className={fieldClass} />
      </label>
      {avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt="Your picture"
          referrerPolicy="no-referrer"
          className="size-14 rounded-full border object-cover"
        />
      )}
      <Status state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save profile
        </Button>
      </div>
    </form>
  );
}
