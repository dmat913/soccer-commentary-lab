-- Discover trending stats: recent (7-day) and total heard counts without user_id leakage.
-- Does not modify discover_posts, discover_saves, discover_heard_events,
-- get_discover_post_heard_counts(), or get_discover_post_save_counts().

create or replace function public.get_discover_post_trending_stats()
returns table (
  post_id uuid,
  recent_heard_count bigint,
  total_heard_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    h.post_id,
    count(*) filter (
      where h.created_at >= (timezone('utc', now()) - interval '7 days')
    )::bigint as recent_heard_count,
    count(*)::bigint as total_heard_count
  from public.discover_heard_events as h
  group by h.post_id;
$$;

revoke all on function public.get_discover_post_trending_stats() from public;
grant execute on function public.get_discover_post_trending_stats() to anon, authenticated;

comment on function public.get_discover_post_trending_stats() is
  'Returns Discover heard counts for the last 7 days and all-time totals without exposing hearer user_ids.';
