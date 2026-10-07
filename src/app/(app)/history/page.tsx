import type { Metadata } from "next";
import { History } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "History" };

export default function Page() {
  return (
    <ComingSoon
      title="History"
      description="Review your past debugging sessions and AI conversations."
      phase={12}
      icon={History}
    />
  );
}
