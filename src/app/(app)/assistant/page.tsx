import type { Metadata } from "next";
import { ChatPanel, type UiMessage } from "@/components/assistant/chat-panel";
import { ConversationList } from "@/components/assistant/conversation-list";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "AI Assistant" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const supabase = await createClient();

  const { data: list } = await supabase
    .from("conversations")
    .select("id, title")
    .eq("type", "assistant")
    .order("updated_at", { ascending: false })
    .limit(50);
  const conversations = (list ?? []) as { id: string; title: string }[];

  let activeId: string | null = null;
  let initial: UiMessage[] = [];
  if (c && UUID.test(c) && conversations.some((x) => x.id === c)) {
    activeId = c;
    const { data: rows } = await supabase
      .from("messages")
      .select("id, role, content")
      .eq("conversation_id", c)
      .order("created_at", { ascending: true })
      .limit(500);
    initial = ((rows ?? []) as { id: string; role: string; content: string }[])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Ask anything about code. Your chats are saved and only you can see them.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <ConversationList conversations={conversations} activeId={activeId} />
        <ChatPanel key={activeId ?? "new"} conversationId={activeId} initialMessages={initial} />
      </div>
    </div>
  );
}
