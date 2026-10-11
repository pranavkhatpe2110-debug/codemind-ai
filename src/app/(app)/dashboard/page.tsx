import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bug,
  ChevronRight,
  FolderKanban,
  MessageSquare,
  Plus,
  Sparkles,
  TriangleAlert,
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
import { StatCard } from "@/components/dashboard/stat-card";
import { timeAgo } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
};

type DebugRow = {
  id: string;
  language: string;
  error_message: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
};

const STATUS_STYLES: Record<DebugRow["status"], string> = {
  completed: "bg-emerald-500",
  failed: "bg-rose-500",
  pending: "bg-amber-500",
};

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
    description: "Describe it, AI writes it.",
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Row Level Security guarantees each query only sees this user's own rows.
  const [profile, projects, sessions, projectCount, sessionCount, chatCount] =
    await Promise.all([
      supabase.from("profiles").select("display_name").maybeSingle(),
      supabase
        .from("projects")
        .select("id, name, description, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("debug_sessions")
        .select("id, language, error_message, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase
        .from("debug_sessions")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true }),
    ]);

  const fullName: string =
    profile.data?.display_name ??
    (typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : undefined) ??
    user?.email?.split("@")[0] ??
    "there";
  const firstName = fullName.split(" ")[0];

  const projectRows = (projects.data ?? []) as ProjectRow[];
  const sessionRows = (sessions.data ?? []) as DebugRow[];
  const loadError = projects.error ?? sessions.error ?? profile.error;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        description="Your AI-powered coding workspace. Pick a quick action to get started."
      />

      {loadError && (
        <div
          role="alert"
          className="mb-8 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-500"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Could not load your data.</p>
            <p className="mt-1 opacity-90">
              Did you run the Phase 4 SQL in Supabase? Details: {loadError.message}
            </p>
          </div>
        </div>
      )}

      <section aria-label="Your numbers" className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard label="Projects" value={projectCount.count ?? 0} icon={FolderKanban} />
        <StatCard label="Debug sessions" value={sessionCount.count ?? 0} icon={Bug} />
        <StatCard label="Conversations" value={chatCount.count ?? 0} icon={MessageSquare} />
      </section>

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
              <CardDescription>Your most recently updated projects.</CardDescription>
            </CardHeader>
            <CardContent>
              {projectRows.length === 0 ? (
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
              ) : (
                <ul className="divide-y">
                  {projectRows.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/projects/${project.id}`}
                        className="group flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                          <FolderKanban className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium group-hover:underline">
                            {project.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {project.description || "No description"} ·{" "}
                            {timeAgo(project.updated_at)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="recent-debug">
          <Card className="h-full">
            <CardHeader>
              <CardTitle id="recent-debug">Recent debugging sessions</CardTitle>
              <CardDescription>Your latest debugger runs.</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionRows.length === 0 ? (
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
              ) : (
                <ul className="divide-y">
                  {sessionRows.map((session) => (
                    <li key={session.id}>
                      <Link
                        href="/history"
                        className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${STATUS_STYLES[session.status]}`}
                          title={session.status}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium group-hover:underline">
                            {session.error_message?.split("\n")[0] || "No error message"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            <span className="rounded border px-1.5 py-0.5 font-mono text-[11px]">
                              {session.language}
                            </span>{" "}
                            · {timeAgo(session.created_at)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
