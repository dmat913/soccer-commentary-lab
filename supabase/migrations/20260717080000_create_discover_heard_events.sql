-- Discover "Heard" reactions: per-user heard state and public heard counts.
-- Independent from `discover_saves` (Vocabulary membership).
-- Heard rows represent current reaction state (insert / delete), not a click log.
-- Counts are exposed without revealing who heard a post.
--
-- This file only adds new objects. It does not modify discover_posts,
-- discover_saves, get_discover_post_save_counts(), or any existing data.

-- ---------------------------------------------------------------------------
-- discover_heard_events
-- Represents "logged-in users who currently mark this post as Heard".
-- Not a cumulative click-event log. Toggle off = DELETE the user's row.
-- ---------------------------------------------------------------------------

create table public.discover_heard_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.discover_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint discover_heard_events_post_id_user_id_key unique (post_id, user_id)
);

-- "My heard" lookups by user_id (unique (post_id, user_id) does not cover this).
create index discover_heard_events_user_id_idx
  on public.discover_heard_events (user_id);

-- Per-post aggregation can use unique (post_id, user_id); no extra post_id index.

alter table public.discover_heard_events enable row level security;

-- Users may read only their own rows (for "already heard" UI).
create policy discover_heard_events_select_own
  on public.discover_heard_events
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy discover_heard_events_insert_own
  on public.discover_heard_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No UPDATE policy: heard rows are insert/delete only.

create policy discover_heard_events_delete_own
  on public.discover_heard_events
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.discover_heard_events to authenticated;
-- anon: no table SELECT (use heard-count function below).

-- ---------------------------------------------------------------------------
-- Public heard counts (no user_id leakage)
-- SECURITY DEFINER aggregates across all heard rows; output is post_id + count only.
-- search_path is pinned to avoid search_path hijacking.
-- ---------------------------------------------------------------------------

create or replace function public.get_discover_post_heard_counts()
returns table (
  post_id uuid,
  heard_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    h.post_id,
    count(*)::bigint as heard_count
  from public.discover_heard_events as h
  group by h.post_id;
$$;

revoke all on function public.get_discover_post_heard_counts() from public;
grant execute on function public.get_discover_post_heard_counts() to anon, authenticated;

comment on table public.discover_heard_events is
  'Current Heard reaction per Discover post (logged-in users only; independent of Vocabulary saves).';
comment on function public.get_discover_post_heard_counts() is
  'Returns Discover heard counts without exposing hearer user_ids.';
