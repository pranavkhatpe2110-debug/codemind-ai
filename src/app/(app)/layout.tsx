import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Second line of defense: the proxy already redirects, but we check again.
  if (!user) redirect("/login");

  const fullName = user.user_metadata?.full_name;

  return (
    <AppShell
      user={{
        email: user.email ?? "",
        name: typeof fullName === "string" && fullName ? fullName : null,
      }}
    >
      {children}
    </AppShell>
  );
}
