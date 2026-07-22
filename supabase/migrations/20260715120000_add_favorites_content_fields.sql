-- Favorites content fields: persist meaning / explanation / learning-point meaning
-- that the app previously kept only in localStorage.
-- Safe for existing rows (nullable columns). Does not change RLS or grants.
--
-- This file is a standalone migration and can also be pasted directly into
-- the Supabase SQL Editor. Do not recreate or rename existing favorites columns.

alter table public.favorites
  add column if not exists meaning text,
  add column if not exists explanation text,
  add column if not exists learning_point_meaning text;

-- Existing rows keep null until the next client sync / insert backfills them.
-- learning_point continues to store Learning Point English text only.
