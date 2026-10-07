import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bug,
  FolderKanban,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    title: "AI Debugger",
    description:
      "Paste your code and the error. Get the cause, the fix and what changed.",
    icon: Bug,
  },
  {
    title: "Explain Code",
    description: "Understand unfamiliar code with clear, step-by-step explanations.",
    icon: BookOpen,
  },
  {
    title: "Fix Code",
    description: "Turn broken code into working code in seconds.",
    icon: Wrench,
  },
  {
    title: "Generate Code",
    description: "Describe what you need and get clean, ready-to-use code.",
    icon: Sparkles,
  },
  {
    title: "Optimize Code",
    description: "Improve speed, readability and structure without changing behavior.",
    icon: Zap,
  },
  {
    title: "Projects & History",
    description: "Keep your files organized and revisit every session and chat.",
    icon: FolderKanban,
  },
];

const BROKEN = `function average(numbers) {
  let total = 0;
  for (let i = 0; i <= numbers.length; i++) {
    total += numbers[i];
  }
  return total / numbers.length;
}`;

const FIXED = `function average(numbers) {
  let total = 0;
  for (let i = 0; i < numbers.length; i++) {
    total += numbers[i];
  }
  return total / numbers.length;
}`;

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="ml-6 hidden gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#preview" className="transition-colors hover:text-foreground">
              Preview
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
              Open dashboard
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(139,92,246,0.25),transparent)]"
          />
          <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              Powered by Claude
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Write, debug and improve code with{" "}
              <span className="bg-[linear-gradient(135deg,#8b5cf6,#6366f1)] bg-clip-text text-transparent">
                AI
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              CodeMind AI is your coding workspace. Find the bug, understand
              the code, fix it and make it better, all in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className={buttonVariants({ size: "lg" })}
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                See features
              </a>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section id="preview" className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-rose-500/70" />
              <span className="h-3 w-3 rounded-full bg-amber-500/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
              <span className="ml-3 text-xs text-muted-foreground">
                Code Debugger
              </span>
            </div>
            <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="p-4">
                <p className="mb-2 text-xs font-medium text-rose-500">
                  Your code
                </p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed sm:text-sm">
                  {BROKEN}
                </pre>
                <p className="mt-3 text-xs text-muted-foreground">
                  Error: <code className="font-mono">NaN</code> returned for every input
                </p>
              </div>
              <div className="p-4">
                <p className="mb-2 text-xs font-medium text-emerald-500">
                  Corrected by CodeMind AI
                </p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed sm:text-sm">
                  {FIXED}
                </pre>
                <p className="mt-3 text-xs text-muted-foreground">
                  The loop ran one step too far and read past the end of the
                  array. Changed <code className="font-mono">{"<="}</code> to{" "}
                  <code className="font-mono">{"<"}</code>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything you need to code better
            </h2>
            <p className="mt-2 text-muted-foreground">
              Simple tools that work together.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="rounded-xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-violet-500/50 hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo />
          <p>Built with Next.js, Supabase and Claude.</p>
        </div>
      </footer>
    </div>
  );
}
