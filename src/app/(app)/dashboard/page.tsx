import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bug,
  FolderKanban,
  Plus,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Dashboard" };

const QUICK_ACTIONS = [
  {
    label: "Debug Code",
    description: "Paste code and an error, get the fix.",
    href: "/debugger",
    icon: Bug,
    tone: "bg-rose-500/10 text-rose-500",
  },
  {
    label: "Explain Code",
    description: "Understand any code, step by step.",
    href: "/tools/explain",
    icon: BookOpen,
    tone: "bg-sky-500/10 text-sky-500",
  },
  {
    label: "Fix Code",
    description: "Turn broken code into working code.",
    href: "/tools/fix",
    icon: Wrench,
    tone: "bg-amber-500/10 text-amber-500",
  },
  {
    label: "Generate Code",
    description: "Describe it, Claude writes it.",
    href: "/tools/generate",
    icon: Sparkles,
    tone: "bg-violet-500/10 text-violet-500",
  },
  {
    label: "Optimize Code",
    description: "Faster, cleaner, easier to maintain.",
    href: "/tools/optimize",
    icon: Zap,
    tone: "bg-emerald-500/10 text-emerald-500",
  },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Welcome to CodeMind AI 👋"
        description="Your AI-powered coding workspace. Pick a quick action to get started."
      />

      <section aria-labelledby="quick-actions" className="mb-10">
        <h2 id="quick-actions" className="mb-4 text-lg font-semibold">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map(({ label, description, href, icon: Icon, tone }) => (
            <Link key={href} href={href} className="group block">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-violet-500/50 group-hover:shadow-md">
                <CardHeader>
                  <div
                    className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="flex items-center justify-between text-base">
                    {label}
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="recent-projects">
          <Card className="h-full">
            <CardHeader>
              <CardTitle id="recent-projects">Recent projects</CardTitle>
              <CardDescription>Your latest projects will show up here.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Create your first project to start organizing your code files."
                action={
                  <Link
                    href="/projects"
                    className={buttonVariants({ size: "sm" })}
                  >
                    <Plus className="h-4 w-4" />
                    New project
                  </Link>
                }
              />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="recent-debug">
          <Card className="h-full">
            <CardHeader>
              <CardTitle id="recent-debug">Recent debugging sessions</CardTitle>
              <CardDescription>
                Your latest debugger runs will show up here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Bug}
                title="No debugging sessions yet"
                description="Paste some code and an error message to debug your first problem."
                action={
                  <Link
                    href="/debugger"
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    Start debugging
                  </Link>
                }
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
