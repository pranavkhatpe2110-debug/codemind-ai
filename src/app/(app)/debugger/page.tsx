import type { Metadata } from "next";
import { Bug } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Code Debugger" };

export default function Page() {
  return (
    <ComingSoon
      title="Code Debugger"
      description="Paste your code and error message and get an explanation and a corrected version."
      phase={9}
      icon={Bug}
    />
  );
}
