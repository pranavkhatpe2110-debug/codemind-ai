import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 font-semibold tracking-tight"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#8b5cf6,#6366f1)] text-white shadow-sm">
        <BrainCircuit className="h-4 w-4" />
      </span>
      <span className="text-base">
        CodeMind <span className="text-violet-500">AI</span>
      </span>
    </Link>
  );
}
