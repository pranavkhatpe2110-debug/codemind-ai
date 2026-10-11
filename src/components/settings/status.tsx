import { Check, TriangleAlert } from "lucide-react";
import type { SettingsState } from "@/lib/settings/actions";

export function Status({ state }: { state: SettingsState }) {
  if (state.error) {
    return (
      <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
        <span>{state.error}</span>
      </div>
    );
  }
  if (state.ok) {
    return (
      <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
        <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
        <span>{state.ok}</span>
      </div>
    );
  }
  return null;
}

export const fieldClass =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
