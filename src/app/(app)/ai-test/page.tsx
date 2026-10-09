import type { Metadata } from "next";
import { AiTest } from "@/components/ai/ai-test";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "AI Test" };

// A temporary page to check the Claude connection. We remove it in Phase 14.
export default function AiTestPage() {
  return (
    <>
      <PageHeader
        title="AI connection test"
        description="Check that CodeMind AI can talk to the AI. This page is temporary."
      />
      <AiTest />
    </>
  );
}
