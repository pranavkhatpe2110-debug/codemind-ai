import Link from "next/link";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteConversation } from "@/lib/assistant/actions";

type Item = { id: string; title: string };

export function ConversationList({
  conversations,
  activeId,
}: {
  conversations: Item[];
  activeId: string | null;
}) {
  return (
    <aside className="flex max-h-48 flex-col gap-2 overflow-hidden rounded-xl border bg-card p-2 lg:max-h-[calc(100dvh-12rem)]">
      <Link
        href="/assistant"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <MessageSquarePlus className="size-4" /> New chat
      </Link>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            No chats yet. Send your first message.
          </p>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-lg ${
                c.id === activeId ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              <Link
                href={`/assistant?c=${c.id}`}
                className="min-w-0 flex-1 truncate px-2 py-2 text-sm"
                title={c.title}
              >
                {c.title}
              </Link>
              <form action={deleteConversation}>
                <input type="hidden" name="id" value={c.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 opacity-60 hover:opacity-100"
                  aria-label={`Delete chat ${c.title}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </form>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
