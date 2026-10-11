import type { Metadata } from "next";
import Link from "next/link";
import { Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/history/local-time";
import { ConfirmForm } from "@/components/projects/confirm-form";
import { deleteHistoryItem } from "@/lib/history/actions";
import {
  HISTORY_TYPES,
  TYPE_LABELS,
  isHistoryType,
  type HistoryItem,
  type HistoryType,
} from "@/lib/history/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "History" };

const PAGE_SIZE = 20;
const FETCH_LIMIT = 200;

function href(item: HistoryItem) {
  if (item.kind === "d") return `/debugger?s=${item.id}`;
  if (item.type === "assistant") return `/assistant?c=${item.id}`;
  return `/history/c/${item.id}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const type = isHistoryType(sp.type) ? sp.type : null;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const supabase = await createClient();
  const items: HistoryItem[] = [];

  // Conversations (chat + the four tools)
  if (type !== "debug") {
    let query = supabase
      .from("conversations")
      .select("id, title, type, updated_at")
      .order("updated_at", { ascending: false })
      .limit(FETCH_LIMIT);
    if (type) query = query.eq("type", type);
    if (q) query = query.ilike("title", `%${q.replace(/[%_\\]/g, "\\$&")}%`);
    const { data } = await query;
    for (const r of (data ?? []) as { id: string; title: string; type: string; updated_at: string }[]) {
      items.push({
        kind: "c",
        id: r.id,
        type: isHistoryType(r.type) ? r.type : "other",
        title: r.title,
        at: r.updated_at,
      });
    }
  }

  // Debug sessions
  if (!type || type === "debug") {
    let query = supabase
      .from("debug_sessions")
      .select("id, language, code, status, created_at")
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT);
    if (q) query = query.ilike("code", `%${q.replace(/[%_\\]/g, "\\$&")}%`);
    const { data } = await query;
    for (const r of (data ?? []) as {
      id: string;
      language: string;
      code: string;
      status: string;
      created_at: string;
    }[]) {
      items.push({
        kind: "d",
        id: r.id,
        type: "debug",
        title: r.code.trim().split("\n")[0].slice(0, 80) || "(empty)",
        at: r.created_at,
        extra: `${r.language} · ${r.status}`,
      });
    }
  }

  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/history?${s}` : "/history";
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Your chats, debug sessions and tool runs in one place. Only you can see them.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          maxLength={100}
          placeholder="Search..."
          aria-label="Search history"
          className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
        />
        <select
          name="type"
          defaultValue={type ?? ""}
          aria-label="Filter by type"
          className="h-9 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">All types</option>
          {HISTORY_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" className="h-9">
          <Search className="size-4" /> Search
        </Button>
        {(q || type) && (
          <Link
            href="/history"
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        )}
      </form>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {q || type
            ? "Nothing matches your search."
            : "Nothing here yet. Use the Assistant, Debugger or a tool and it will show up."}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((item) => {
            const label = item.type === "other" ? "Other" : TYPE_LABELS[item.type as HistoryType];
            return (
              <li key={`${item.kind}-${item.id}`} className="flex items-center gap-2 rounded-xl border bg-card p-3">
                <Link href={href(item)} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="mr-2 rounded bg-muted px-1.5 py-0.5">{label}</span>
                    {item.extra && <span className="mr-2">{item.extra}</span>}
                    <LocalTime iso={item.at} />
                  </p>
                </Link>
                <ConfirmForm action={deleteHistoryItem} message="Delete this item? This cannot be undone.">
                  <input type="hidden" name="kind" value={item.kind} />
                  <input type="hidden" name="id" value={item.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${item.title}`}
                    className="size-8 shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </ConfirmForm>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pages">
          {current > 1 ? (
            <Link href={pageHref(current - 1)} className="rounded-lg border px-3 py-1.5 hover:bg-accent">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {current} of {pages}
          </span>
          {current < pages ? (
            <Link href={pageHref(current + 1)} className="rounded-lg border px-3 py-1.5 hover:bg-accent">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
