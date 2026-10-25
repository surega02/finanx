-- ONLY for a disposable PostgreSQL test cluster. Supabase auth is simulated.
\set ON_ERROR_STOP on
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
grant usage on schema auth, public to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
\ir ../supabase/schema.sql
grant select, insert, update, delete on public.profiles, public.categories, public.transactions to authenticated;
insert into public.categories (id, user_id, type, name, icon) values
('historical', '00000000-0000-0000-0000-000000000001', 'expense', 'Before migration', 'wallet'),
('historical', '00000000-0000-0000-0000-000000000002', 'expense', 'Account B', 'wallet');
insert into public.transactions (id, user_id, type, amount, date, category_id, description) values
('old', '00000000-0000-0000-0000-000000000001', 'expense', 9223372036854775807, '2025-12-31', 'historical', 'Before migration'),
('old', '00000000-0000-0000-0000-000000000002', 'expense', 5, '2027-01-01', 'historical', 'Private B');
\ir ../supabase/migrations/202610220002_financial_settings.sql
do $$begin
  assert (select count(*) from public.transactions) = 2, 'migration lost V1 records';
  assert (select count(*) from public.financial_settings) = 0, 'migration backfilled settings';
end$$;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
insert into public.financial_settings(user_id, opening_balance_amount, opening_balance_date, updated_at)
values (auth.uid(), 0, '2027-01-15', '2000-01-01');
do $$declare s jsonb;begin
  assert (select count(*) from public.transactions) = 1, 'transaction read leak';
  assert (select count(*) from public.categories) = 1, 'category read leak';
  assert (select count(*) from public.financial_settings) = 1;
  assert (select updated_at > '2026-01-01' from public.financial_settings), 'client clock accepted';
  s := public.ledger_snapshot_v2();
  assert jsonb_array_length(s->'transactions') = 1;
  assert s->'transactions'->0->>'amount' = '9223372036854775807', 'bigint rounding';
  assert s->'settings'->>'opening_balance_amount' = '0';
  begin
    update public.financial_settings set user_id = '00000000-0000-0000-0000-000000000002';
    raise exception 'owner reassignment allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.financial_settings(user_id) values ('00000000-0000-0000-0000-000000000002');
    raise exception 'other owner insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.financial_settings set opening_balance_amount = -1;
    raise exception 'negative opening allowed';
  exception when check_violation then null; end;
  begin
    update public.financial_settings set opening_balance_amount = 1000000000000000;
    raise exception 'oversized opening allowed';
  exception when check_violation then null; end;
  begin
    update public.financial_settings set opening_balance_date = null;
    raise exception 'unpaired opening allowed';
  exception when check_violation then null; end;
  begin
    insert into public.transactions(id,user_id,type,amount,date,category_id) values ('cross', '00000000-0000-0000-0000-000000000002','expense',1,'2026-01-01','historical');
    raise exception 'cross-owner tx insert allowed';
  exception when insufficient_privilege then null; end;
end$$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$declare n int; s jsonb;begin
  assert (select count(*) from public.financial_settings) = 0, 'settings read leak';
  update public.financial_settings set opening_balance_amount = 1 where user_id = '00000000-0000-0000-0000-000000000001'; get diagnostics n = row_count; assert n = 0, 'settings update leak';
  delete from public.financial_settings where user_id = '00000000-0000-0000-0000-000000000001'; get diagnostics n = row_count; assert n = 0, 'settings delete leak';
  update public.transactions set amount = 1 where user_id = '00000000-0000-0000-0000-000000000001'; get diagnostics n = row_count; assert n = 0, 'tx update leak';
  delete from public.transactions where user_id = '00000000-0000-0000-0000-000000000001'; get diagnostics n = row_count; assert n = 0, 'tx delete leak';
  s := public.ledger_snapshot_v2(); assert jsonb_array_length(s->'transactions') = 1; assert s->'transactions'->0->>'description' = 'Private B';
end$$;
insert into public.financial_settings(user_id,opening_balance_amount,opening_balance_date) values (auth.uid(),999999999999999,'2020-01-01');
update public.financial_settings set opening_balance_amount = null, opening_balance_date = null;
delete from public.financial_settings where user_id = auth.uid();
reset role;
set role anon;
do $$begin
  begin perform public.ledger_snapshot_v2(); raise exception 'anon snapshot allowed'; exception when insufficient_privilege then null; end;
  begin perform * from public.financial_settings; raise exception 'anon settings allowed'; exception when insufficient_privilege then null; end;
end$$;
reset role;
do $$begin assert (select count(*) from public.transactions) = 2, 'reset/rollback lost transactions'; end$$;
select 'PASS: additive migration, exact snapshot, constraints, timestamp, RLS two simulated identities, owner reassignment and V1 preservation';
