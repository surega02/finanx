-- Read-only diagnosis for account B failing to load. Run in Supabase SQL Editor.
-- Does not read user identities, tokens, categories, or transactions.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'categories', 'transactions');

select c.relname as table_name, con.conname as constraint_name,
       pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('categories', 'transactions')
  and con.contype in ('p', 'u', 'f')
order by c.relname, con.conname;

select to_regprocedure('public.ensure_system_categories(uuid)') as seed_function;

select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'categories', 'transactions');
