# CodeMind AI: security notes

What protects the app (and where):

- **Secrets stay on the server.** AI keys are read only in server code (`import "server-only"`),
  from environment variables. `.env.local` is in `.gitignore`.
- **Login required.** `src/proxy.ts` redirects visitors; every server page, action and API route
  checks the user again.
- **Row Level Security (RLS).** Every table only returns rows where `user_id = auth.uid()`.
  Server code also filters by `user_id` (two locks, not one).
- **Code is never run.** Code you paste is only sent to the AI as text.
- **AI request limits.** In memory (20 per minute) and in the database (20 per minute, 300 per day,
  table `ai_usage`). Change the daily number with `AI_DAILY_LIMIT`.
- **Input checks.** Sizes, languages, file names, ids (UUID) and URLs are validated on the server.
- **AI answers are shown as plain text** (no raw HTML), so an answer cannot inject scripts.
- **Security headers** in `next.config.ts` (no framing, no content sniffing, strict referrer, https only in production).
- **Private pages are hidden from search engines** (`src/app/robots.ts`).

Before you launch (checklist):

1. Run `supabase/audit-rls.sql`: every table must show `rls_enabled = true`.
2. In Supabase: Authentication -> turn "Confirm email" back ON, and set Site URL and Redirect URLs to your real address.
3. Rotate any key that was ever shown in a screenshot or chat.
4. Run `npm audit` and fix "high" problems.
5. Never commit `.env.local` or `.zip` files: `git ls-files | grep -E "^\.env|\.zip$"` must print nothing.
