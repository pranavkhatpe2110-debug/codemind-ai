import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeleteDataForm } from "@/components/settings/delete-data-form";
import { PasswordForm } from "@/components/settings/password-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { getUserSettings } from "@/lib/settings/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const settings = await getUserSettings();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your profile, preferences and account.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileForm
          email={user.email ?? ""}
          displayName={profile?.display_name ?? ""}
          avatarUrl={profile?.avatar_url ?? ""}
        />
        <PreferencesForm settings={settings} />
        <PasswordForm />
        <DeleteDataForm />
      </div>
    </div>
  );
}
