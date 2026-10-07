import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "AI Assistant" };

export default function Page() {
  return (
    <ComingSoon
      title="AI Assistant"
      description="Chat with Claude about programming, concepts and your code."
      phase={8}
      icon={MessageSquare}
    />
  );
}
