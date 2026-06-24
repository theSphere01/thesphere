-- Separate staff identities from camper profiles. Staff accounts are created in
-- Supabase Auth, then an administrator assigns their role with SQL/Dashboard.
create table if not exists public.staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_users enable row level security;

revoke all on table public.staff_users from anon;
revoke insert, update, delete on table public.staff_users from authenticated;
grant select on table public.staff_users to authenticated;

drop policy if exists "staff users can read own role" on public.staff_users;
create policy "staff users can read own role"
  on public.staff_users
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.staff_users is
  'Authorization roles for Supabase Auth staff accounts. Do not store camper identities here.';
