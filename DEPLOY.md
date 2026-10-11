# Deploying CodeMind AI (GitHub + Vercel + Supabase)

1. `npm run build` must succeed in the Codespace first.
2. Push to GitHub (private repo). Never commit `.env.local` or `.zip` files.
3. Vercel: Add New Project -> import the repo -> add the environment variables below -> Deploy.
4. Supabase: Authentication -> URL Configuration -> set Site URL and Redirect URLs to the Vercel address.
5. Supabase: turn "Confirm email" back ON.

Environment variables to add in Vercel (values come from your own `.env.local`; never share them in chat):

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SITE_URL   (the Vercel address, e.g. https://your-app.vercel.app)
- AI_PROVIDER            (gemini)
- GEMINI_API_KEY         (mark as Sensitive)
- GEMINI_MODEL           (e.g. gemini-flash-latest)
- AI_DAILY_LIMIT         (optional, default 300)
