-- Discover MVP: public commentary posts and per-user Vocabulary-save records.
-- Independent from `favorites` and `vocabulary_items` (no FKs to those tables).
-- Posts are snapshots; Favorite deletion does not affect Discover posts.
-- Save counts are exposed without revealing saver user_ids.
--
-- This file is a standalone migration and can also be pasted directly into
-- the Supabase SQL Editor. It only adds new objects; it does not modify any
-- existing table, policy, trigger, function, index, or data.

-- ---------------------------------------------------------------------------
-- discover_posts
-- ---------------------------------------------------------------------------

create table public.discover_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Auxiliary only: Favorite ids are not stable across local/remote. No FK.
  source_favorite_id uuid null,
  english_text text not null,
  meaning text not null,
  japanese_text text not null,
  learning_point_text text not null,
  learning_point_meaning text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discover_posts_english_text_not_blank_check
    check (char_length(trim(english_text)) > 0),
  constraint discover_posts_meaning_not_blank_check
    check (char_length(trim(meaning)) > 0),
  constraint discover_posts_japanese_text_not_blank_check
    check (char_length(trim(japanese_text)) > 0),
  constraint discover_posts_learning_point_text_not_blank_check
    check (char_length(trim(learning_point_text)) > 0),
  constraint discover_posts_learning_point_meaning_not_blank_check
    check (char_length(trim(learning_point_meaning)) > 0)
);

-- One post per user per English expression (trim-normalized).
-- Different users may publish the same english_text.
create unique index discover_posts_user_id_english_text_trim_key
  on public.discover_posts (user_id, (trim(both from english_text)));

-- Newest-first feed.
create index discover_posts_created_at_idx
  on public.discover_posts (created_at desc);

-- Author listing: leading column of the unique index already helps user_id
-- equality, but a dedicated index keeps author timelines efficient.
create index discover_posts_user_id_created_at_idx
  on public.discover_posts (user_id, created_at desc);

alter table public.discover_posts enable row level security;

-- Public read: no author email / Auth metadata is stored on this table.
create policy discover_posts_select_public
  on public.discover_posts
  for select
  to anon, authenticated
  using (true);

create policy discover_posts_insert_own
  on public.discover_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No UPDATE policy: posts are immutable in the Discover MVP.

create policy discover_posts_delete_own
  on public.discover_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select on public.discover_posts to anon, authenticated;
grant insert, delete on public.discover_posts to authenticated;

-- ---------------------------------------------------------------------------
-- discover_saves
-- Represents "logged-in users who currently have this post in Vocabulary".
-- Not a cumulative click-event log.
-- ---------------------------------------------------------------------------

create table public.discover_saves (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.discover_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint discover_saves_post_id_user_id_key unique (post_id, user_id)
);

-- "My saves" lookups by user_id (unique (post_id, user_id) does not cover this).
create index discover_saves_user_id_idx
  on public.discover_saves (user_id);

-- Per-post aggregation can use unique (post_id, user_id); no extra post_id index.

alter table public.discover_saves enable row level security;

-- Savers may read only their own rows (for "already saved" UI).
create policy discover_saves_select_own
  on public.discover_saves
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy discover_saves_insert_own
  on public.discover_saves
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No UPDATE policy: save rows are insert/delete only.

create policy discover_saves_delete_own
  on public.discover_saves
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.discover_saves to authenticated;
-- anon: no table SELECT (use save-count function below).

-- ---------------------------------------------------------------------------
-- Public save counts (no user_id leakage)
-- SECURITY DEFINER aggregates across all saves; output is post_id + count only.
-- search_path is pinned to avoid search_path hijacking.
-- ---------------------------------------------------------------------------

create or replace function public.get_discover_post_save_counts()
returns table (
  post_id uuid,
  save_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.post_id,
    count(*)::bigint as save_count
  from public.discover_saves as s
  group by s.post_id;
$$;

revoke all on function public.get_discover_post_save_counts() from public;
grant execute on function public.get_discover_post_save_counts() to anon, authenticated;

comment on table public.discover_posts is
  'Public Discover posts: Favorites snapshot content without Auth profile fields.';
comment on table public.discover_saves is
  'Current Vocabulary-save membership per Discover post (logged-in users only).';
comment on function public.get_discover_post_save_counts() is
  'Returns Discover save counts without exposing saver user_ids.';
