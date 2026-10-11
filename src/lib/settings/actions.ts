"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLanguageId } from "@/lib/languages";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_AVATAR_URL,
  MAX_DISPLAY_NAME,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  isTheme,
} from "./types";

export type SettingsState = { error?: string; ok?: string; stamp?: number };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function text(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function updateProfile(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase, user } = await requireUser();
  const displayName = text(formData, "displayName").trim();
  const avatarUrl = text(formData, "avatarUrl").trim();

  if (displayName.length > MAX_DISPLAY_NAME) {
    return { error: `The name is too long (max ${MAX_DISPLAY_NAME}).` };
  }
  if (avatarUrl) {
    if (avatarUrl.length > MAX_AVATAR_URL) return { error: "The picture link is too long." };
    let ok = false;
    try {
      ok = new URL(avatarUrl).protocol === "https:";
    } catch {
      ok = false;
    }
    if (!ok) return { error: "The picture link must start with https://" };
  }

  const values = {
    display_name: displayName || null,
    avatar_url: avatarUrl || null,
    updated_at: new Date().toISOString(),
  };

  // The profile row is normally created at sign-up. Update it; if it is missing, create it.
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", user.id)
    .select("id");
  if (error) return { error: "Could not save your profile. Please try again." };
  if (!updated || updated.length === 0) {
    const { error: insertError } = await supabase.from("profiles").insert({ id: user.id, ...values });
    if (insertError) return { error: "Could not save your profile. Please try again." };
  }

  revalidatePath("/settings");
  return { ok: "Profile saved.", stamp: Date.now() };
}

export async function updatePreferences(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase, user } = await requireUser();
  const theme = text(formData, "theme");
  const language = text(formData, "defaultLanguage");
  const size = Number.parseInt(text(formData, "fontSize"), 10);

  if (!isTheme(theme)) return { error: "Please choose a theme." };
  if (!isLanguageId(language)) return { error: "Please choose a language from the list." };
  if (!Number.isInteger(size) || size < MIN_FONT_SIZE || size > MAX_FONT_SIZE) {
    return { error: `Font size must be between ${MIN_FONT_SIZE} and ${MAX_FONT_SIZE}.` };
  }

  const values = {
    theme,
    default_language: language,
    editor_font_size: size,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from("user_settings")
    .update(values)
    .eq("user_id", user.id)
    .select("id");
  if (error) return { error: "Could not save your settings. Please try again." };
  if (!updated || updated.length === 0) {
    const { error: insertError } = await supabase
      .from("user_settings")
      .insert({ user_id: user.id, ...values });
    if (insertError) return { error: "Could not save your settings. Please try again." };
  }

  revalidatePath("/settings");
  return { ok: "Settings saved.", stamp: Date.now() };
}

export async function changePassword(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase, user } = await requireUser();
  const current = text(formData, "currentPassword");
  const next = text(formData, "newPassword");
  const confirm = text(formData, "confirmPassword");

  if (!user.email) return { error: "This account has no email, so the password cannot be changed here." };
  if (!current) return { error: "Please type your current password." };
  if (next.length < 8) return { error: "The new password must be at least 8 characters." };
  if (next.length > 72) return { error: "The new password is too long (max 72)." };
  if (next !== confirm) return { error: "The two new passwords do not match." };
  if (next === current) return { error: "The new password must be different from the current one." };

  // Check the current password first, so a stolen open session cannot change it silently.
  const { error: checkError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (checkError) return { error: "The current password is not correct." };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: "Could not change the password. Please try again." };
  return { ok: "Password changed.", stamp: Date.now() };
}

/** Deletes everything the user created. The account, profile and settings stay. */
export async function deleteMyData(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase, user } = await requireUser();
  if (text(formData, "confirm").trim() !== "DELETE") {
    return { error: 'Type the word DELETE (in capital letters) to confirm.' };
  }

  // Children first, so this works even without "cascade" in the database.
  const steps = ["messages", "conversations", "debug_sessions", "project_files", "projects"] as const;
  for (const table of steps) {
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) {
      return { error: `Could not delete everything (stopped at ${table}). Please try again.` };
    }
  }

  for (const path of ["/dashboard", "/projects", "/history", "/assistant", "/debugger", "/settings"]) {
    revalidatePath(path);
  }
  return { ok: "All your chats, debug sessions, projects and files were deleted.", stamp: Date.now() };
}
