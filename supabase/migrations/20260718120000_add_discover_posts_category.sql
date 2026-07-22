-- Discover posts: commentary situation category for feed filtering.
-- Existing rows receive default 'general'. Does not change RLS, grants,
-- UPDATE policies, or existing constraints beyond adding this column/check.
--
-- This file is a standalone migration and can also be pasted directly into
-- the Supabase SQL Editor. Create only — do not run from the app deploy path.

alter table public.discover_posts
  add column if not exists category text not null default 'general';

alter table public.discover_posts
  drop constraint if exists discover_posts_category_check;

alter table public.discover_posts
  add constraint discover_posts_category_check
  check (
    category in (
      'goal',
      'shot',
      'pass',
      'dribble',
      'save',
      'defending',
      'set-piece',
      'general'
    )
  );

comment on column public.discover_posts.category is
  'Commentary situation category inferred at publish time (immutable in MVP).';

-- No category index: post volume is still small and client-side filtering is
-- sufficient for the Discover MVP. Revisit if listPosts starts filtering in SQL.
