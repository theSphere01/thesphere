-- Parent email OTP login.
-- The parent phone remains the lookup key; this email is the verified delivery
-- target for parent portal OTP codes.

alter table public.profiles
  add column if not exists parent_email text;

create index if not exists profiles_parent_email_idx
  on public.profiles (lower(parent_email))
  where parent_email is not null;

create index if not exists profiles_parent_phone_email_idx
  on public.profiles (parent_phone, lower(parent_email))
  where parent_email is not null;

comment on column public.profiles.parent_email is
  'Parent email linked to parent_phone for email OTP login.';
