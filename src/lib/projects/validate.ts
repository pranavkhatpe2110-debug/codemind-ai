import { LANGUAGES } from "@/lib/languages";

export const MAX_PROJECT_NAME = 100;
export const MAX_PROJECT_DESCRIPTION = 500;
export const MAX_FILE_PATH = 255;
export const MAX_FILE_CONTENT = 500_000; // matches the database rule

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns a cleaned path like "src/app.js", or an error message. */
export function cleanFilePath(raw: string): { ok: true; path: string } | { ok: false; error: string } {
  const path = raw.trim().replace(/\\/g, "/");
  if (!path) return { ok: false, error: "Please type a file name, like main.py" };
  if (path.length > MAX_FILE_PATH) return { ok: false, error: "That file name is too long." };
  if (path.startsWith("/") || path.endsWith("/")) {
    return { ok: false, error: "The name cannot start or end with a slash." };
  }
  if (!/^[A-Za-z0-9._\- /]+$/.test(path)) {
    return { ok: false, error: "Use only letters, numbers, dot, dash, underscore, space and /." };
  }
  const parts = path.split("/");
  if (parts.some((p) => p.trim() === "" || p === "." || p === "..")) {
    return { ok: false, error: "That file name is not valid." };
  }
  return { ok: true, path };
}

/** Picks the editor language from the file extension. */
export function languageForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGES.find((l) => l.extension === ext)?.id ?? "plaintext";
}
