import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return (
    <ComingSoon
      title="Projects"
      description="Create projects and manage the files inside them."
      phase={11}
      icon={FolderKanban}
    />
  );
}
