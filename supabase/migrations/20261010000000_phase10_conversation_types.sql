-- Phase 10: allow the four tool types in conversations.type.
-- Safe to run more than once. It only widens the allowed values.
alter table public.conversations drop constraint if exists conversations_type_check;
alter table public.conversations
  add constraint conversations_type_check
  check (type in ('assistant','explain','fix','generate','optimize','debug','chat','general'))
  not valid;
