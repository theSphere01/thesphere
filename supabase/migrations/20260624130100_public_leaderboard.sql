-- ============================================================
-- FIX #4 — Child-data exposure on the public leaderboard
--
-- The public leaderboard must never leak camper PII (full name,
-- parent name/phone, exact visit timestamps). This view is the ONLY
-- camper data anon may read: a privacy-preserving display name
-- (first name + last initial) plus gamification stats. It runs with
-- the view owner's rights (security_invoker = false) so it can read
-- profiles even though that table denies the anon role under RLS.
-- ============================================================

create or replace view public.public_leaderboard
with (security_invoker = false) as
select
  p.id as profile_id,
  case
    when position(' ' in btrim(p.name)) > 0
      then split_part(btrim(p.name), ' ', 1) || ' '
           || left(split_part(btrim(p.name), ' ', 2), 1) || '.'
    else btrim(p.name)
  end as name,
  p.avatar_url,
  p.total_points,
  p.season_points,
  p.visit_count,
  coalesce(array_length(p.lands_visited, 1), 0) as lands_count,
  p.current_streak
from public.profiles p;

-- Only the safe view is exposed to the public roles.
revoke all on public.public_leaderboard from anon, authenticated;
grant select on public.public_leaderboard to anon, authenticated;
