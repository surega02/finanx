-- ============================================================
-- FINANX — Supabase schema
-- Tables + Row Level Security for the personal finance ledger.
-- Run this in the Supabase SQL editor (or as a migration).
-- ============================================================

-- Profiles: one row per auth user.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  photo_url text,
  language text not null default 'id',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categories: per-user categories, seeded from the app's system list on first sign-in.
create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  name text not null,
  name_id text,
  icon text not null,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists categories_user_idx on public.categories (user_id, type);

-- Transactions: one row per ledger entry, category stored as a foreign key.
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount bigint not null check (amount > 0),
  date date not null,
  category_id text not null references public.categories (id),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "categories_own" on public.categories;
create policy "categories_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions_own" on public.transactions;
create policy "transactions_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed the per-user system categories on first sign-in.
create or replace function public.ensure_system_categories(uid uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.categories where user_id = uid and source = 'system') then
    insert into public.categories (id, user_id, type, name, name_id, icon, source)
    values
      ('income_salary',       uid, 'income',  'Salary',        'Gaji',          'wallet',    'system'),
      ('income_business',     uid, 'income',  'Business',      'Usaha',         'briefcase', 'system'),
      ('income_bonus',        uid, 'income',  'Bonus',         'Bonus',         'gift',      'system'),
      ('income_gift',         uid, 'income',  'Gift',          'Hadiah',        'present',   'system'),
      ('income_other',        uid, 'income',  'Other',         'Lainnya',       'coins',     'system'),
      ('expense_food',        uid, 'expense', 'Food',          'Makanan',       'utensils',  'system'),
      ('expense_transportation', uid, 'expense', 'Transportation', 'Transportasi', 'car',    'system'),
      ('expense_shopping',    uid, 'expense', 'Shopping',      'Belanja',       'bag',       'system'),
      ('expense_bills',       uid, 'expense', 'Bills',         'Tagihan',       'receipt',   'system'),
      ('expense_entertainment', uid, 'expense', 'Entertainment','Hiburan',      'gamepad',   'system'),
      ('expense_health',      uid, 'expense', 'Health',        'Kesehatan',     'heart',     'system'),
      ('expense_education',   uid, 'expense', 'Education',     'Pendidikan',    'book',      'system'),
      ('expense_other',       uid, 'expense', 'Other',         'Lainnya',       'ellipsis',  'system');
  end if;
end;
$$;
