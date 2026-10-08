"use client";

import { LANGUAGES } from "@/lib/languages";

export function LanguageSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (languageId: string) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:[color-scheme:dark]"
    >
      {LANGUAGES.map((language) => (
        <option key={language.id} value={language.id}>
          {language.label}
        </option>
      ))}
    </select>
  );
}
