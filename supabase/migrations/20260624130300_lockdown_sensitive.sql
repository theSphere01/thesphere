-- ============================================================
-- Defence in depth: hard-deny the anon role on every table that
-- holds camper / session / PII data. RLS already returns zero rows
-- for anon (no policy), but revoking the grant turns silent empty
-- results into an explicit "permission denied", matching how
-- staff_users is locked. All app access to these tables goes through
-- API routes using the service-role key, which bypasses grants/RLS.
-- ============================================================

revoke all on public.profiles         from anon;
revoke all on public.wristbands       from anon;
revoke all on public.sessions         from anon;
revoke all on public.land_hours       from anon;
revoke all on public.points_log       from anon;
revoke all on public.discount_codes   from anon;
revoke all on public.profile_badges   from anon;
revoke all on public.daily_ceremonies from anon;
revoke all on public.ceremony_winners from anon;
