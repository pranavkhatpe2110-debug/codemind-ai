"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/languages";
import { updatePreferences, type SettingsState } from "@/lib/settings/actions";
import {
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  THEMES,
  isTheme,
  type UserSettings,
} from "@/lib/settings/types";
import { Status, fieldClass } from "./status";

export function PreferencesForm({ settings }: { settings: UserSettings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updatePreferences, {});
  const { setTheme } = useTheme();
  const themeRef = useRef<HTMLSelectElement>(null);

  // After a successful save, apply the chosen theme right away.
  useEffect(() => {
    if (state.ok && themeRef.current && isTheme(themeRef.current.value)) {
      setTheme(themeRef.current.value);
    }
  }, [state.stamp, state.ok, setTheme]);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 className="text-base font-semibold">Preferences</h2>
      <label className="flex flex-col gap-1 text-sm">
        Theme
        <select ref={themeRef} name="theme" defaultValue={settings.theme} className={fieldClass}>
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {t === "system" ? "Same as my device" : t === "dark" ? "Dark" : "Light"}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Default language
        <select name="defaultLanguage" defaultValue={settings.default_language} className={fieldClass}>
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Editor font size ({MIN_FONT_SIZE} to {MAX_FONT_SIZE})
        <input
          name="fontSize"
          type="number"
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={1}
          defaultValue={settings.editor_font_size}
          className={fieldClass}
        />
      </label>
      <Status state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save preferences
        </Button>
      </div>
    </form>
  );
}
