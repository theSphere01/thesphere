-- ============================================================
-- Phone OTP — secures the parent portal. Previously anyone could open any
-- camper's profile just by typing a phone number (broken access control).
-- Now a phone login requires a one-time code sent by SMS. This table stores
-- the hashed codes; all access is via service-role API routes (anon denied).
-- ============================================================

create table if not exists public.phone_otps (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  profile_id  uuid references public.profiles(id) on delete cascade,
  code_hash   text not null,
  expires_at  timestamptz not null,
  consumed    boolean not null default false,
  attempts    int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists phone_otps_phone_idx on public.phone_otps(phone);
create index if not exists phone_otps_expires_idx on public.phone_otps(expires_at);

alter table public.phone_otps enable row level security;
revoke all on public.phone_otps from anon;
