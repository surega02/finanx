# Supabase setup (cloud mode)

Finanx runs in **demo mode** by default (data in `localStorage`, simulated Google login).
To enable real auth + cloud storage, follow these steps. Nothing breaks until you add the env vars.

## 1. Create a Supabase project

1. Go to https://supabase.com → **New project** (free tier, no credit card).
2. Note your project's **URL** and **anon key**: Dashboard → Settings → API.

## 2. Run the schema

Open the Supabase SQL editor and run the contents of `supabase/schema.sql`.
This creates:
- `profiles` — one row per user (name, email, photo, language)
- `categories` — per-user categories with RLS
- `transactions` — per-user ledger entries with RLS
- `ensure_system_categories(uid)` — seeds the built-in category list on first sign-in

## 3. Enable Google OAuth

1. Supabase Dashboard → Authentication → Providers → **Google** → Enable.
2. You need a Google OAuth **Client ID + Client Secret**:
   - Go to https://console.cloud.google.com → APIs & Services → Credentials → Create OAuth client ID.
   - Application type: **Web application**.
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Paste the Client ID / Secret into Supabase and save.

## 4. Add local env vars

Create `.env` in the project root (copy from `.env.example`):

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Then restart the dev server (`npm run dev`).

## 5. Configure site URL (for production / preview)

Supabase Dashboard → Authentication → URL Configuration:
- Site URL: your deployed app origin (e.g. `https://finanx.web.app`).
- Add redirect URLs as needed.

## How it behaves

- **Env vars present** → cloud mode: real Google sign-in, data read from / written to
  Supabase (transaction & category rows mirrored on every mutation).
- **Env vars empty** → demo mode: current offline behavior with `localStorage` and
  the simulated sign-in. The demo disclaimer only shows in this mode.