-- Book parent-selected lands, then let staff scans start/complete play sessions.
create table if not exists public.land_bookings (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  land_id       text not null references public.lands(id) on delete cascade,
  booking_date  date not null default current_date,
  status        text not null default 'booked'
    check (status in ('booked','started','completed','cancelled')),
  session_id    uuid references public.sessions(id) on delete set null,
  land_hour_id  uuid references public.land_hours(id) on delete set null,
  started_at    timestamptz,
  completed_at  timestamptz,
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (profile_id, land_id, booking_date)
);

create index if not exists land_bookings_profile_date_idx
  on public.land_bookings(profile_id, booking_date);

create index if not exists land_bookings_land_date_idx
  on public.land_bookings(land_id, booking_date);

create index if not exists land_bookings_session_idx
  on public.land_bookings(session_id);

alter table public.land_bookings enable row level security;

comment on table public.land_bookings is
  'Parent-facing land reservations. Access is intentionally server-mediated because rows reference camper profiles.';
