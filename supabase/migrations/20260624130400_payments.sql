-- ============================================================
-- Payments — provider-agnostic ledger.
-- Works immediately with the "manual" provider (cash / POS recorded by
-- staff) and is ready for online gateways (e.g. Flash) via the same table.
-- Sensitive: anon is hard-denied; all access is through API routes using
-- the service-role key after a staff guard. Webhooks update by provider_ref.
-- ============================================================

create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references public.profiles(id) on delete set null,
  amount       numeric(12,2) not null check (amount >= 0),
  currency     text not null default 'EGP',
  status       text not null default 'pending'
               check (status in ('pending','paid','failed','refunded','cancelled')),
  provider     text not null default 'manual',
  provider_ref text,
  purpose      text not null default 'other'
               check (purpose in ('registration','daily_ticket','package','other')),
  description  text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists payments_profile_id_idx  on public.payments(profile_id);
create index if not exists payments_status_idx       on public.payments(status);
create index if not exists payments_provider_ref_idx on public.payments(provider_ref);
create index if not exists payments_created_at_idx    on public.payments(created_at desc);

alter table public.payments enable row level security;
-- No anon/authenticated policy: deny by default; service role bypasses RLS.
revoke all on public.payments from anon;
