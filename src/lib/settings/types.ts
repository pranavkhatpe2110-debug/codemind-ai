export const THEMES = ["dark", "light", "system"] as const;
export type Theme = (typeof THEMES)[number];

export type UserSettings = {
  theme: Theme;
  default_language: string;
  editor_font_size: number;
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  default_language: "javascript",
  editor_font_size: 14,
};

export const MIN_FONT_SIZE = 10; // matches the database rule
export const MAX_FONT_SIZE = 24;
export const MAX_DISPLAY_NAME = 100;
export const MAX_AVATAR_URL = 500;

export function isTheme(v: unknown): v is Theme {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v);
}
