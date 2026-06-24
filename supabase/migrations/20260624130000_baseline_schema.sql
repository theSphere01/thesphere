-- ============================================================
-- THE SPHERE — Baseline schema
-- Creates every table the application code touches, with the
-- column names the route handlers actually use (reconciled from
-- the live code, not the type definitions). Foreign keys are
-- declared where PostgREST embeds depend on them
-- (e.g. lands -> stations, profile_badges -> badge_definitions).
--
-- Security model: all writes flow through Next.js API routes that
-- use the service-role key (which bypasses RLS) AFTER an auth guard.
-- RLS is therefore defence-in-depth against direct use of the public
-- anon key: public catalog tables are anon-readable; every table
-- holding camper / session / PII data is locked (no anon policy).
-- ============================================================

-- ── Reference / catalog tables ──────────────────────────────

create table if not exists public.seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  is_active   boolean not null default false,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now()
);

create table if not exists public.lands (
  id              text primary key,
  name            text not null,
  slug            text not null unique,
  description     text,
  tagline         text,
  theme_color     text,
  icon_emoji      text,
  age_min         int,
  age_max         int,
  cover_image_url text,
  is_active       boolean not null default true,
  is_open_today   boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists public.stations (
  id            text primary key,
  land_id       text not null references public.lands(id) on delete cascade,
  name          text not null,
  description   text,
  age_min       int,
  age_max       int,
  emoji         text,
  is_active     boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists stations_land_id_idx on public.stations(land_id);

create table if not exists public.land_photos (
  id         uuid primary key default gen_random_uuid(),
  land_id    text not null references public.lands(id) on delete cascade,
  url        text not null,
  caption    text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists land_photos_land_id_idx on public.land_photos(land_id);

create table if not exists public.badge_definitions (
  id                 text primary key,
  name               text not null,
  description        text,
  emoji              text,
  rarity             text,
  category           text,
  criteria_type      text,
  criteria_value     int,
  criteria_land_slug text,
  is_active          boolean not null default true,
  display_order      int not null default 0,
  created_at         timestamptz not null default now()
);

create table if not exists public.points_config (
  id         uuid primary key default gen_random_uuid(),
  rule_type  text not null unique,
  value      numeric not null,
  is_active  boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.discount_config (
  id             uuid primary key default gen_random_uuid(),
  condition_key  text not null unique,
  discount_value numeric not null,
  is_active      boolean not null default true,
  updated_at     timestamptz not null default now()
);

create table if not exists public.site_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- ── Camper-facing tables (PII / sensitive) ──────────────────

create table if not exists public.profiles (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  age             int,
  avatar_url      text,
  parent_name     text,
  parent_phone    text,
  total_points    int not null default 0,
  season_points   int not null default 0,
  visit_count     int not null default 0,
  current_streak  int not null default 0,
  lands_visited   text[] not null default '{}',
  last_visit_date date,
  created_at      timestamptz not null default now()
);
create index if not exists profiles_total_points_idx on public.profiles(total_points desc);
create index if not exists profiles_parent_phone_idx on public.profiles(parent_phone);

create table if not exists public.wristbands (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  nfc_uid    text,
  qr_code    text,
  nfc_token  text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists wristbands_qr_code_idx on public.wristbands(qr_code);
create index if not exists wristbands_nfc_uid_idx on public.wristbands(nfc_uid);

create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  season_id     uuid references public.seasons(id) on delete set null,
  status        text not null default 'active' check (status in ('active','completed','cancelled')),
  check_in_at   timestamptz not null default now(),
  check_out_at  timestamptz,
  total_hours   numeric not null default 0,
  points_earned int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists sessions_profile_id_idx on public.sessions(profile_id);
create index if not exists sessions_status_idx on public.sessions(status);
create index if not exists sessions_check_in_at_idx on public.sessions(check_in_at);

create table if not exists public.land_hours (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  profile_id   uuid references public.profiles(id) on delete cascade,
  land_id      text not null,
  check_in_at  timestamptz not null default now(),
  check_out_at timestamptz,
  hours        numeric,
  created_at   timestamptz not null default now()
);
create index if not exists land_hours_session_id_idx on public.land_hours(session_id);
create index if not exists land_hours_profile_id_idx on public.land_hours(profile_id);
create index if not exists land_hours_land_id_idx on public.land_hours(land_id);

create table if not exists public.points_log (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  session_id     uuid references public.sessions(id) on delete cascade,
  rule_type      text not null,
  points_awarded int not null default 0,
  notes          text,
  created_at     timestamptz not null default now()
);
create index if not exists points_log_profile_id_idx on public.points_log(profile_id);
create index if not exists points_log_session_id_idx on public.points_log(session_id);
-- Idempotency: a given session can log a given rule only once.
create unique index if not exists points_log_session_rule_uniq
  on public.points_log(session_id, rule_type)
  where session_id is not null;

create table if not exists public.profile_badges (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_id   text not null references public.badge_definitions(id) on delete cascade,
  earned_at  timestamptz not null default now(),
  unique (profile_id, badge_id)
);
create index if not exists profile_badges_profile_id_idx on public.profile_badges(profile_id);

create table if not exists public.discount_codes (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  session_id       uuid references public.sessions(id) on delete set null,
  code             text not null unique,
  discount_percent int not null default 0,
  discount_type    text not null,
  valid_until      date,
  is_used          boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists discount_codes_profile_id_idx on public.discount_codes(profile_id);

create table if not exists public.daily_ceremonies (
  id            uuid primary key default gen_random_uuid(),
  ceremony_date date not null,
  season_id     uuid references public.seasons(id) on delete set null,
  status        text not null default 'scheduled' check (status in ('scheduled','completed')),
  total_campers int not null default 0,
  conducted_at  timestamptz,
  conducted_by  uuid,
  created_at    timestamptz not null default now()
);
create index if not exists daily_ceremonies_date_idx on public.daily_ceremonies(ceremony_date);

create table if not exists public.ceremony_winners (
  id            uuid primary key default gen_random_uuid(),
  ceremony_id   uuid not null references public.daily_ceremonies(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  rank          int not null,
  points_earned int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists ceremony_winners_ceremony_id_idx on public.ceremony_winners(ceremony_id);
create index if not exists ceremony_winners_profile_id_idx on public.ceremony_winners(profile_id);

create table if not exists public.daily_land_schedule (
  id            uuid primary key default gen_random_uuid(),
  schedule_date date not null,
  land_id       text not null references public.lands(id) on delete cascade,
  is_open       boolean not null default true,
  unique (schedule_date, land_id)
);
create index if not exists daily_land_schedule_date_idx on public.daily_land_schedule(schedule_date);

create table if not exists public.daily_station_schedule (
  id            uuid primary key default gen_random_uuid(),
  schedule_date date not null,
  station_id    text not null references public.stations(id) on delete cascade,
  is_active     boolean not null default true,
  unique (schedule_date, station_id)
);
create index if not exists daily_station_schedule_date_idx on public.daily_station_schedule(schedule_date);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS everywhere.
alter table public.seasons                enable row level security;
alter table public.lands                  enable row level security;
alter table public.stations               enable row level security;
alter table public.land_photos            enable row level security;
alter table public.badge_definitions      enable row level security;
alter table public.points_config          enable row level security;
alter table public.discount_config        enable row level security;
alter table public.site_settings          enable row level security;
alter table public.daily_land_schedule    enable row level security;
alter table public.daily_station_schedule enable row level security;
alter table public.profiles               enable row level security;
alter table public.wristbands             enable row level security;
alter table public.sessions               enable row level security;
alter table public.land_hours             enable row level security;
alter table public.points_log             enable row level security;
alter table public.profile_badges         enable row level security;
alter table public.discount_codes         enable row level security;
alter table public.daily_ceremonies       enable row level security;
alter table public.ceremony_winners       enable row level security;

-- Public, non-sensitive catalog data: readable by anyone.
do $$
declare t text;
begin
  foreach t in array array[
    'seasons','lands','stations','land_photos','badge_definitions',
    'points_config','discount_config','site_settings',
    'daily_land_schedule','daily_station_schedule'
  ]
  loop
    execute format(
      'drop policy if exists "public read %1$s" on public.%1$I;', t
    );
    execute format(
      'create policy "public read %1$s" on public.%1$I for select to anon, authenticated using (true);', t
    );
  end loop;
end $$;

-- Sensitive tables (profiles, wristbands, sessions, land_hours,
-- points_log, profile_badges, discount_codes, daily_ceremonies,
-- ceremony_winners) get NO anon / authenticated policy on purpose.
-- RLS is enabled with no policy => deny all for those roles.
-- The service-role key (server-only, used by API routes) bypasses
-- RLS, so the application keeps working while the public anon key
-- can never read camper PII directly.

-- ============================================================
-- Storage bucket for uploaded media (avatars, land photos)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('sphere-media', 'sphere-media', true)
on conflict (id) do nothing;

-- Public read of media objects; writes happen via service role.
drop policy if exists "public read sphere-media" on storage.objects;
create policy "public read sphere-media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'sphere-media');
