import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, Sparkles, Wrench, Zap, type LucideIcon } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

const TOOLS: Record<
  string,
  { title: string; description: string; icon: LucideIcon }
> = {
  explain: {
    title: "Explain Code",
    description: "Get a clear, step-by-step explanation of any code.",
    icon: BookOpen,
  },
  fix: {
    title: "Fix Code",
    description: "Describe the problem and get working, corrected code.",
    icon: Wrench,
  },
  generate: {
    title: "Generate Code",
    description: "Describe what you need and let Claude write the code.",
    icon: Sparkles,
  },
  optimize: {
    title: "Optimize Code",
    description: "Make your code faster, cleaner and easier to maintain.",
    icon: Zap,
  },
};

type Props = { params: Promise<{ tool: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params;
  const info = TOOLS[tool];
  return { title: info ? info.title : "Tool" };
}

export default async function ToolPage({ params }: Props) {
  const { tool } = await params;
  const info = TOOLS[tool];
  if (!info) notFound();

  return (
    <ComingSoon
      title={info.title}
      description={info.description}
      phase={10}
      icon={info.icon}
    />
  );
}
