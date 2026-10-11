import type { Metadata } from "next";
import Link from "next/link";
import { DebuggerPanel } from "@/components/debugger/debugger-panel";
import { parseDebugResult } from "@/lib/debugger/parse";
import type { DebugResult } from "@/lib/debugger/types";
import { getUserSettings } from "@/lib/settings/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "AI Debugger" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  language: string;
  code: string;
  error_message: string;
  result: unknown;
  status: string;
  created_at: string;
};

export default async function DebuggerPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const settings = await getUserSettings();
  const supabase = await createClient();

  const { data } = await supabase
    .from("debug_sessions")
    .select("id, language, code, error_message, result, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  const recent = (data ?? []) as Row[];

  let selected: Row | undefined = s && UUID.test(s) ? recent.find((r) => r.id === s) : undefined;
  if (!selected && s && UUID.test(s)) {
    const { data: one } = await supabase
      .from("debug_sessions")
      .select("id, language, code, error_message, result, status, created_at")
      .eq("id", s)
      .maybeSingle();
    selected = (one ?? undefined) as Row | undefined;
  }
  const initialResult: DebugResult | null = selected?.result
    ? parseDebugResult(JSON.stringify(selected.result))
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Debugger</h1>
        <p className="text-sm text-muted-foreground">
          Paste code and the error. The AI finds the cause and suggests a fix. Your code is
          only read by the AI. It is never run.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <DebuggerPanel
          key={selected?.id ?? "new"}
          defaultLanguage={settings.default_language}
          initial={
            selected
              ? {
                  language: selected.language,
                  code: selected.code,
                  errorMessage: selected.error_message,
                  result: initialResult,
                }
              : null
          }
        />
        <aside className="h-fit rounded-xl border bg-card p-2">
          <Link
            href="/debugger"
            className="mb-2 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            New debug
          </Link>
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">Recent</p>
          {recent.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="space-y-1">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/debugger?s=${r.id}`}
                    className={`block rounded-lg px-2 py-2 text-sm ${
                      r.id === selected?.id ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                  >
                    <span className="block truncate">{r.code.trim().split("\n")[0].slice(0, 40) || "(empty)"}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.language} · {r.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
