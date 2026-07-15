-- Vocabulary learning status: system-driven mastery tracking.
-- Adds status / streak / last-reviewed columns to existing `vocabulary_items`.
-- Safe for existing rows via NOT NULL DEFAULT + nullable last_reviewed_at.
-- Does not change RLS policies or grants.
--
-- This file is a standalone migration and can also be pasted directly into
-- the Supabase SQL Editor.

alter table public.vocabulary_items
  add column if not exists status text not null default 'new',
  add column if not exists correct_streak integer not null default 0,
  add column if not exists last_reviewed_at timestamptz;

-- Existing rows receive defaults above (new / 0 / null).
-- Constrain allowed values after the columns exist.
alter table public.vocabulary_items
  drop constraint if exists vocabulary_items_status_check;

alter table public.vocabulary_items
  add constraint vocabulary_items_status_check
  check (status in ('new', 'learning', 'mastered'));

alter table public.vocabulary_items
  drop constraint if exists vocabulary_items_correct_streak_check;

alter table public.vocabulary_items
  add constraint vocabulary_items_correct_streak_check
  check (correct_streak >= 0);
