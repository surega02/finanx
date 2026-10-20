-- Upgrade the legacy FINANX schema without deleting user data.
-- Back up the database first. Run this entire file in Supabase SQL Editor.
-- A failed preflight/constraint check rolls back the entire transaction.
begin;
set local lock_timeout = '10s';
set local statement_timeout = '60s';

lock table public.categories, public.transactions in access exclusive mode;

do $$
declare
  category_count bigint;
  transaction_count bigint;
begin
  select count(*) into category_count from public.categories;
  select count(*) into transaction_count from public.transactions;

  if exists (select 1 from public.categories where user_id is null or id is null)
     or exists (select 1 from public.transactions where user_id is null or id is null) then
    raise exception 'Migration stopped: categories/transactions contain null owners or IDs';
  end if;
  if exists (select 1 from public.categories group by user_id, id having count(*) > 1)
     or exists (select 1 from public.transactions group by user_id, id having count(*) > 1) then
    raise exception 'Migration stopped: duplicate per-user IDs require review';
  end if;
  if exists (
    select 1 from public.transactions t
    where not exists (
      select 1 from public.categories c
      where c.user_id = t.user_id and c.id = t.category_id
    )
  ) then
    raise exception 'Migration stopped: a transaction references a missing category or another owner; review data before retrying';
  end if;

  -- Drop only the known category reference. Never CASCADE into other tables.
  alter table public.transactions drop constraint if exists transactions_category_id_fkey;
  alter table public.transactions drop constraint if exists transactions_user_id_category_id_fkey;
  alter table public.categories drop constraint if exists categories_pkey;
  alter table public.transactions drop constraint if exists transactions_pkey;

  alter table public.categories alter column user_id set not null;
  alter table public.transactions alter column user_id set not null;
  alter table public.categories add constraint categories_pkey primary key (user_id, id);
  alter table public.transactions add constraint transactions_pkey primary key (user_id, id);
  alter table public.transactions add constraint transactions_user_id_category_id_fkey
    foreign key (user_id, category_id) references public.categories (user_id, id);

  if category_count <> (select count(*) from public.categories)
     or transaction_count <> (select count(*) from public.transactions) then
    raise exception 'Migration stopped: unexpected row count change';
  end if;
end;
$$;

-- The seed function is replaced below in the same transaction.
create or replace function public.ensure_system_categories(uid uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> uid then
    raise exception 'Not authorized to seed categories for this user';
  end if;

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
      ('expense_other',       uid, 'expense', 'Other',         'Lainnya',       'ellipsis',  'system')
    on conflict (user_id, id) do nothing;
end;
$$;

notify pgrst, 'reload schema';
commit;

