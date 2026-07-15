-- Vocabulary Book: per-user saved commentary expressions for study.
-- Independent from `favorites` and `commentary_history`.
-- Unlike `favorites`, this table persists the Japanese meaning and the
-- learning point meaning so they are never dropped on the server.
--
-- This file is a standalone migration and can also be pasted directly into
-- the Supabase SQL Editor. It only adds new objects; it does not modify any
-- existing table, policy, trigger, function, index, or data.

create table public.vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  english_text text not null,
  meaning text not null default '',
  japanese_text text not null default '',
  learning_point_text text,
  learning_point_meaning text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vocabulary_items_user_id_english_text_key unique (user_id, english_text)
);

-- Fast per-user listing in newest-first order.
create index vocabulary_items_user_id_created_at_idx
  on public.vocabulary_items (user_id, created_at desc);

alter table public.vocabulary_items enable row level security;

-- Row Level Security: authenticated users may only access their own rows.
-- Anonymous (anon) users have no policy and therefore no access.
create policy vocabulary_items_select_own
  on public.vocabulary_items
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy vocabulary_items_insert_own
  on public.vocabulary_items
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy vocabulary_items_update_own
  on public.vocabulary_items
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy vocabulary_items_delete_own
  on public.vocabulary_items
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.vocabulary_items to authenticated;
