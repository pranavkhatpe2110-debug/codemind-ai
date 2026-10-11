import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot, User } from "lucide-react";
import { MessageContent } from "@/components/assistant/message-content";
import { LocalTime } from "@/components/history/local-time";
import { TYPE_LABELS, isHistoryType } from "@/lib/history/types";
import { UUID } from "@/lib/projects/validate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "History item" };

// A read-only view of one saved conversation (used for the Explain / Fix /
// Generate / Optimize runs). Normal chats open in the Assistant instead.
export default async function HistoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return notFound();

  const supabase = await createClient();
  const { data: convo } = await supabase
    .from("conversations")
    .select("id, title, type, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!convo) return notFound();

  const { data: rows } = await supabase
    .from("messages")
    .select("id, role, content")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);
  const messages = (rows ?? []) as { id: string; role: string; content: string }[];
  const label = isHistoryType(convo.type) ? TYPE_LABELS[convo.type] : "Other";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/history"
          className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> History
        </Link>
        <h1 className="break-words text-xl font-semibold tracking-tight">{convo.title}</h1>
        <p className="text-xs text-muted-foreground">
          <span className="mr-2 rounded bg-muted px-1.5 py-0.5">{label}</span>
          <LocalTime iso={convo.created_at} />
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages saved.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div className="min-w-0 flex-1 rounded-xl bg-muted/40 px-3 py-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {m.role === "user" ? "You sent" : "AI answer"}
                </p>
                <MessageContent content={m.content} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
