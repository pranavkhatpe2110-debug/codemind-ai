-- Run this in the Supabase SQL Editor any time. It only READS settings.
-- Part 1: every table in "public" must show rls_enabled = true.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- Part 2: the policies. Every one should mention auth.uid() and the user's own id.
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
