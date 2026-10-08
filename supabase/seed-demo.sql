-- OPTIONAL demo data, so you can see the dashboard with real rows.
-- Run in Supabase -> SQL Editor. It adds sample rows for every existing user.

insert into public.projects (user_id, name, description)
select id, 'Demo: Todo app', 'A sample project to preview the dashboard' from auth.users;

insert into public.projects (user_id, name, description)
select id, 'Demo: Weather CLI', null from auth.users;

insert into public.debug_sessions (user_id, language, code, error_message, status)
select id, 'python', 'print(undefined_name)',
       'NameError: name ''undefined_name'' is not defined', 'completed'
from auth.users;

insert into public.debug_sessions (user_id, language, code, error_message, status)
select id, 'javascript', 'const x = y + 1;',
       'ReferenceError: y is not defined', 'failed'
from auth.users;

insert into public.conversations (user_id, title)
select id, 'Demo chat' from auth.users;

-- To REMOVE the demo data later, run these three lines:
-- delete from public.projects      where name like 'Demo:%';
-- delete from public.debug_sessions where code in ('print(undefined_name)', 'const x = y + 1;');
-- delete from public.conversations  where title = 'Demo chat';
