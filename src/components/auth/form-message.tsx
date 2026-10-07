import { CircleAlert, CircleCheck } from "lucide-react";

export function FormMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-500"
      >
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }
  if (success) {
    return (
      <div
        role="status"
        className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500"
      >
        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{success}</span>
      </div>
    );
  }
  return null;
}
