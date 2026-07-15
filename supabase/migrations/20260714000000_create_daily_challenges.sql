-- Daily Challenge: one session per user per calendar day (JST date stored as date).
-- Independent from `vocabulary_items`, `favorites`, and `commentary_history`.
-- Stores a frozen question snapshot so in-progress / completed Challenges remain
-- restorable even if the source Vocabulary is later edited or deleted.
--
-- This file is a standalone migration and can also be pasted directly into
-- the Supabase SQL Editor. It only adds new objects; it does not modify any
-- existing table, policy, trigger, function, index, or data.

create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_date date not null,
  status text not null default 'in_progress',
  questions jsonb not null,
  question_vocabulary_ids jsonb not null default '[]'::jsonb,
  current_question_index integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_challenges_status_check
    check (status in ('in_progress', 'completed')),
  constraint daily_challenges_current_question_index_check
    check (current_question_index >= 0),
  constraint daily_challenges_correct_count_check
    check (correct_count >= 0),
  constraint daily_challenges_incorrect_count_check
    check (incorrect_count >= 0),
  constraint daily_challenges_current_streak_check
    check (current_streak >= 0),
  constraint daily_challenges_longest_streak_check
    check (longest_streak >= 0),
  constraint daily_challenges_user_id_challenge_date_key
    unique (user_id, challenge_date)
);

-- No extra index: unique (user_id, challenge_date) already supports
-- equality lookup for "today" and ordered scans for per-user date history.

alter table public.daily_challenges enable row level security;

-- Row Level Security: authenticated users may only access their own rows.
-- Anonymous (anon) users have no policy and therefore no access.
create policy daily_challenges_select_own
  on public.daily_challenges
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy daily_challenges_insert_own
  on public.daily_challenges
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy daily_challenges_update_own
  on public.daily_challenges
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy daily_challenges_delete_own
  on public.daily_challenges
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.daily_challenges to authenticated;
