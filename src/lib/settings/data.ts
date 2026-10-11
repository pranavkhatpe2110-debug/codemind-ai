import "server-only";
import { isLanguageId } from "@/lib/languages";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_SETTINGS,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  isTheme,
  type UserSettings,
} from "./types";

/** The logged-in user's saved settings, with safe defaults if there are none yet. */
export async function getUserSettings(): Promise<UserSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_SETTINGS;

  const { data } = await supabase
    .from("user_settings")
    .select("theme, default_language, editor_font_size")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return DEFAULT_SETTINGS;

  const size = Number(data.editor_font_size);
  return {
    theme: isTheme(data.theme) ? data.theme : DEFAULT_SETTINGS.theme,
    default_language: isLanguageId(data.default_language)
      ? data.default_language
      : DEFAULT_SETTINGS.default_language,
    editor_font_size:
      Number.isInteger(size) && size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE
        ? size
        : DEFAULT_SETTINGS.editor_font_size,
  };
}
