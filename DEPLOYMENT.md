# The Sphere — Deployment & Handoff Guide

Stack: **Next.js 16** (App Router) · **Supabase** (Postgres + Auth + Storage) · **Vercel**.

This app talks to Supabase **only through its own API routes**, which run on the
server with the service-role key *after* an auth guard. The browser only ever
holds the public anon key, and Row Level Security blocks that key from reading
any camper data directly.

---

## 0. Accounts you create (one-time)

You must create these yourself (sign-up + verification):

1. **Supabase** account → https://supabase.com
2. **Vercel** account → https://vercel.com
3. **GitHub** account → https://github.com

Then hand over the keys below and the rest (schema, migrations, deploy) can be
finished for you.

---

## 1. Supabase project

1. Create a new project. Pick a strong database password and a region close to
   Egypt (e.g. `eu-central-1`).
2. Open **SQL Editor** and run the four migration files in
   `supabase/migrations/`, **in this exact order**:

   1. `20260624122926_staff_auth_rbac.sql`  — staff roles table
   2. `20260624130000_baseline_schema.sql`  — all tables, RLS, indexes, storage bucket
   3. `20260624130100_public_leaderboard.sql` — safe public leaderboard view
   4. `20260624130200_seed.sql`             — 11 lands, stations, badges, config

   (Or, with the Supabase CLI: `supabase link` then `supabase db push`.)

3. Collect the keys from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)

4. The `sphere-media` storage bucket is created by the migration (public read).
   Nothing else to do.

### Create the first admin

Staff sign in with a Supabase Auth account; their role lives in `staff_users`.

1. **Authentication → Users → Add user** — create the admin's email + password.
2. Copy that user's UUID, then in the SQL editor:

   ```sql
   insert into public.staff_users (user_id, role)
   values ('PASTE-AUTH-USER-UUID', 'admin');
   ```

3. They can now sign in at `/staff/login`. Use role `'staff'` for desk staff who
   should reach `/checkin` but not `/admin`.

---

## 2. Environment variables

See `.env.example`. Five variables:

| Variable | Where | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | never expose |
| `NFC_SIGNING_SECRET` | **server only** | ≥ 32 random chars; signs wristband tokens |
| `NEXT_PUBLIC_APP_URL` | client + server | e.g. `https://thesphere.vercel.app` |

Generate the NFC secret once and keep it stable (rotating it invalidates every
issued wristband):

```bash
openssl rand -base64 48
```

---

## 3. GitHub

```bash
# from the sphere-app/ folder (already a git repo with one commit)
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

---

## 4. Vercel

1. **Add New… → Project**, import the GitHub repo.
2. If the repo root is this `sphere-app/` folder, leave **Root Directory** as is.
   If you pushed the whole parent folder, set **Root Directory** to `sphere-app`.
3. Framework preset: **Next.js** (auto-detected).
4. Add the five environment variables from section 2 (Production + Preview).
5. **Deploy.** After it builds, set `NEXT_PUBLIC_APP_URL` to the real domain and
   redeploy so share links / QR profile URLs are correct.

---

## 5. Security verification (run after deploy)

- `POST /api/sessions/check-out` while logged out → **401**.
- `POST /api/stations` or `PATCH /api/points-config` while logged out → **401/403**.
- Check out the same session twice → second response has
  `was_already_checked_out: true` and points do **not** change.
- Tamper one character of a wristband token, then scan → **"Invalid wristband
  signature"** (401).
- With the anon key, query `profiles` directly → blocked by RLS.
  Query `public_leaderboard` → returns only display name + stats (no parent
  name/phone, no full name).

---

## 6. Known limitations / follow-ups

- **Per-land badges** ("Art Explorer", etc.): FIXED — checkout now maps land id
  → slug before evaluating land-visit badge criteria.
- **Mock-data mode**: with no Supabase env set, the app served sample data for
  design preview. Now that staff routes are guarded, those guarded endpoints
  return 503 in mock mode — expected; mock mode is for visual preview only.
- **Public self-service writes**: `POST /api/register`, `POST /api/auth/lookup`
  (phone), and `POST /api/profiles/[id]/avatar` are intentionally public (camper
  flows, UUID-gated). Add rate-limiting at the edge if abuse becomes a concern.
