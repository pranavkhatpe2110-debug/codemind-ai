# CodeMind AI

An AI coding workspace in the browser: chat with an AI assistant, debug errors, run one-click code tools, and keep your projects and history in one place.

**Live demo:** https://codemind-ai-three.vercel.app

## Features

- **AI Assistant** – streaming chat with saved conversations
- **Debugger** – paste code and an error, get a structured explanation and fix
- **Code tools** – Explain, Fix, Generate and Optimize code
- **Projects** – create projects and files, edit them in a Monaco (VS Code-style) editor
- **History** – browse past conversations and debug sessions
- **Settings** – profile, preferences, password change, delete your data
- **Auth** – email/password sign-up with email confirmation (Supabase Auth)

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Row Level Security)
- Google Gemini (default). Anthropic and OpenAI-compatible providers are also supported through the `AI_PROVIDER` setting.
- Monaco Editor
- Deployed on Vercel

## Security

- AI API keys are used only on the server (environment variables), never in the browser.
- Row Level Security is enabled on every table; users can only read and write their own rows.
- Per-user rate limits on all AI endpoints.
- User code is never executed on the server.
- See [SECURITY.md](./SECURITY.md) and `supabase/audit-rls.sql`.

## Run locally

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project and run the SQL files in `supabase/migrations`.
3. Create `.env.local` (never commit it):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-gemini-key
   GEMINI_MODEL=gemini-flash-latest
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Deploy

See [DEPLOY.md](./DEPLOY.md) for the full Vercel + Supabase checklist.

## Screenshots

_Add screenshots of the Assistant, Debugger and Projects pages here._
