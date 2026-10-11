-- Phase 14: a database-backed limit for AI requests.
-- Each AI request adds one row. The app counts the last minute and the last day.
-- Safe to run more than once.

create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_time_idx
  on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage
  for select using (auth.uid() = user_id);

drop policy if exists "ai_usage_insert_own" on public.ai_usage;
create policy "ai_usage_insert_own" on public.ai_usage
  for insert with check (auth.uid() = user_id);

drop policy if exists "ai_usage_delete_own" on public.ai_usage;
create policy "ai_usage_delete_own" on public.ai_usage
  for delete using (auth.uid() = user_id);
