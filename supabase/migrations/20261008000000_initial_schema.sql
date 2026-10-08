-- =====================================================================
-- CodeMind AI - Phase 4: database schema + Row Level Security (RLS)
-- Run this ONCE in Supabase -> SQL Editor. It runs as a single transaction:
-- if anything fails, nothing is created and you can safely run it again.
-- =====================================================================

-- ---------- helper: keep updated_at fresh ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- tables ----------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 100),
  avatar_url   text check (char_length(avatar_url) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.user_settings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users (id) on delete cascade,
  theme            text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  default_language text not null default 'javascript' check (char_length(default_language) <= 50),
  editor_font_size integer not null default 14 check (editor_font_size between 10 and 24),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  description text check (char_length(description) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.project_files (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  path       text not null check (char_length(path) between 1 and 255),
  language   text not null default 'plaintext' check (char_length(language) <= 50),
  content    text not null default '' check (char_length(content) <= 500000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);

create table public.debug_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  project_id    uuid references public.projects (id) on delete set null,
  language      text not null check (char_length(language) <= 50),
  code          text not null check (char_length(code) <= 100000),
  error_message text check (char_length(error_message) <= 20000),
  result        jsonb,
  status        text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null default 'New chat' check (char_length(title) between 1 and 200),
  type       text not null default 'assistant' check (type in ('assistant', 'explain', 'fix', 'generate', 'optimize')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null check (char_length(content) <= 100000),
  created_at      timestamptz not null default now()
);

-- ---------- indexes (make lists fast) ----------
create index projects_user_idx       on public.projects (user_id, updated_at desc);
create index project_files_proj_idx  on public.project_files (project_id);
create index project_files_user_idx  on public.project_files (user_id);
create index debug_sessions_user_idx on public.debug_sessions (user_id, created_at desc);
create index debug_sessions_proj_idx on public.debug_sessions (project_id);
create index conversations_user_idx  on public.conversations (user_id, updated_at desc);
create index messages_conv_idx       on public.messages (conversation_id, created_at);
create index messages_user_idx       on public.messages (user_id);

-- ---------- updated_at triggers ----------
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_user_settings_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();
create trigger set_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger set_project_files_updated_at before update on public.project_files
  for each row execute function public.set_updated_at();
create trigger set_debug_sessions_updated_at before update on public.debug_sessions
  for each row execute function public.set_updated_at();
create trigger set_conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

-- ---------- new user -> profile + settings (automatic) ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
  );
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users who registered before this script existed get their rows now.
insert into public.profiles (id, display_name)
select u.id, coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

insert into public.user_settings (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;

-- ---------- turn Row Level Security ON for every table ----------
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.debug_sessions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- ---------- privileges: logged-in users only, nothing for anonymous ----------
revoke all on public.profiles, public.user_settings, public.projects, public.project_files,
              public.debug_sessions, public.conversations, public.messages from anon;

grant select, update                 on public.profiles       to authenticated;
grant select, insert, update         on public.user_settings  to authenticated;
grant select, insert, update, delete on public.projects       to authenticated;
grant select, insert, update, delete on public.project_files  to authenticated;
grant select, insert, update, delete on public.debug_sessions to authenticated;
grant select, insert, update, delete on public.conversations  to authenticated;
grant select, insert, delete         on public.messages       to authenticated;

-- ---------- RLS policies: every user sees ONLY their own rows ----------
-- profiles
create policy "Users can view own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- user_settings
create policy "Users can view own settings" on public.user_settings
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can insert own settings" on public.user_settings
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users can update own settings" on public.user_settings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- projects
create policy "Users can view own projects" on public.projects
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can create own projects" on public.projects
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users can update own projects" on public.projects
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users can delete own projects" on public.projects
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- project_files
create policy "Users can view own files" on public.project_files
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can create files in own projects" on public.project_files
  for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Users can update own files" on public.project_files
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Users can delete own files" on public.project_files
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- debug_sessions
create policy "Users can view own debug sessions" on public.debug_sessions
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can create own debug sessions" on public.debug_sessions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))));
create policy "Users can update own debug sessions" on public.debug_sessions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))));
create policy "Users can delete own debug sessions" on public.debug_sessions
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- conversations
create policy "Users can view own conversations" on public.conversations
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can create own conversations" on public.conversations
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users can update own conversations" on public.conversations
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users can delete own conversations" on public.conversations
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- messages
create policy "Users can view own messages" on public.messages
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can create messages in own conversations" on public.messages
  for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = (select auth.uid())));
create policy "Users can delete own messages" on public.messages
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- check: every table below must show rls_enabled = true ----------
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;
