-- FINANX V2: verify deployed RLS in Supabase SQL Editor as postgres.
-- Replace ONLY the two UID placeholders below with the two tested Auth user IDs.
-- No password/token needed. This simulates database request identity, NOT JWT validation.
-- Every fixture and probe write is rolled back via nested exception blocks.
-- Only a session-temporary table containing test outcomes survives for the final SELECT.
-- Run the entire file as ONE batch. No persistent function/schema is created.

do $verify$
declare
  account_a uuid := 'GANTI_UID_A';
  account_b uuid := 'GANTI_UID_B';
  category_a text := 'finanx_rls_cat_a_' || gen_random_uuid();
  category_b text := 'finanx_rls_cat_b_' || gen_random_uuid();
  tx_a text := 'finanx_rls_tx_a_' || gen_random_uuid();
  tx_b text := 'finanx_rls_tx_b_' || gen_random_uuid();
  actor uuid;
  other_owner uuid;
  own_category text;
  foreign_category text;
  own_tx text;
  foreign_tx text;
  leg integer;
  table_name text;
  owner_column text;
  own_id text;
  foreign_id text;
  operation text;
  statement text;
  affected bigint;
  state text;
  passed boolean;
  report jsonb := '[]'::jsonb;
  snapshot jsonb;
begin
  if account_a = account_b then raise exception 'UID A dan B harus berbeda'; end if;
  if not exists(select 1 from auth.users where id=account_a)
     or not exists(select 1 from auth.users where id=account_b) then
    raise exception 'Kedua UID harus tersedia di Authentication Users proyek ini';
  end if;
  drop table if exists pg_temp.finanx_v2_rls_report;
  create temporary table finanx_v2_rls_report(result jsonb not null);

  begin
    perform set_config('lock_timeout','3s',true);
    insert into public.profiles(id,name) values(account_a,'FINANX RLS test'),(account_b,'FINANX RLS test') on conflict(id) do nothing;
    insert into public.categories(id,user_id,type,name,icon,source) values
      (category_a,account_a,'expense','FINANX RLS temporary','wallet','user'),
      (category_b,account_b,'expense','FINANX RLS temporary','wallet','user');
    insert into public.transactions(id,user_id,type,amount,date,category_id,description) values
      (tx_a,account_a,'expense',1,current_date,category_a,'FINANX RLS temporary'),
      (tx_b,account_b,'expense',1,current_date,category_b,'FINANX RLS temporary');
    insert into public.financial_settings(user_id) values(account_a),(account_b) on conflict(user_id) do nothing;

    for leg in 1..2 loop
      actor := case when leg=1 then account_a else account_b end;
      other_owner := case when leg=1 then account_b else account_a end;
      own_category := case when leg=1 then category_a else category_b end;
      foreign_category := case when leg=1 then category_b else category_a end;
      own_tx := case when leg=1 then tx_a else tx_b end;
      foreign_tx := case when leg=1 then tx_b else tx_a end;
      execute 'set local role authenticated';
      perform set_config('request.jwt.claim.sub',actor::text,true);
      perform set_config('request.jwt.claim.role','authenticated',true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
      passed := current_user='authenticated' and auth.uid()=actor
        and exists(select 1 from pg_roles where rolname=current_user and not rolbypassrls and not rolsuper);
      report := report || jsonb_build_array(jsonb_build_object('direction',leg,'test','authenticated_context','passed',passed));
      if not passed then raise exception 'Konteks authenticated tidak aktif; pengujian dibatalkan'; end if;

      foreach table_name in array array['profiles','categories','transactions','financial_settings'] loop
        owner_column := case when table_name='profiles' then 'id' else 'user_id' end;
        own_id := case table_name when 'categories' then own_category when 'transactions' then own_tx else actor::text end;
        foreign_id := case table_name when 'categories' then foreign_category when 'transactions' then foreign_tx else other_owner::text end;

        foreach operation in array array['own_select','foreign_select','foreign_insert','foreign_update','foreign_delete','owner_reassignment'] loop
          affected := null;
          state := null;
          passed := false;
          begin
            if operation in ('own_select','foreign_select') then
              execute format('select count(*) from public.%I where %I=$1 and %I::text=$2',table_name,owner_column,case when table_name='financial_settings' then 'user_id' else 'id' end)
                into affected using case when operation='own_select' then actor else other_owner end,
                  case when operation='own_select' then own_id else foreign_id end;
            elsif operation='foreign_insert' then
              statement := case table_name
                when 'profiles' then 'insert into public.profiles(id,name) values($1,''FINANX RLS probe'')'
                when 'categories' then 'insert into public.categories(user_id,id,type,name,icon) values($1,$2,''expense'',''FINANX RLS probe'',''wallet'')'
                when 'transactions' then 'insert into public.transactions(user_id,id,type,amount,date,category_id) values($1,$2,''expense'',1,current_date,$3)'
                when 'financial_settings' then 'insert into public.financial_settings(user_id) values($1)' end;
              execute statement using other_owner,'finanx_rls_probe_' || gen_random_uuid(),foreign_category;
              get diagnostics affected = row_count;
            elsif operation='foreign_update' then
              execute format('update public.%I set updated_at=updated_at where %I=$1 and %I::text=$2',table_name,owner_column,case when table_name='financial_settings' then 'user_id' else 'id' end)
                using other_owner,foreign_id;
              get diagnostics affected = row_count;
            elsif operation='foreign_delete' then
              execute format('delete from public.%I where %I=$1 and %I::text=$2',table_name,owner_column,case when table_name='financial_settings' then 'user_id' else 'id' end)
                using other_owner,foreign_id;
              get diagnostics affected = row_count;
            else
              execute format('update public.%I set %I=$1 where %I=$2 and %I::text=$3',table_name,owner_column,owner_column,case when table_name='financial_settings' then 'user_id' else 'id' end)
                using other_owner,actor,own_id;
              get diagnostics affected = row_count;
            end if;
            -- Roll back even an unexpectedly permitted write before the next probe.
            raise exception using errcode='PZ001',message='FINANX rollback probe';
          exception
            when sqlstate 'PZ001' then null;
            when others then state := sqlstate;
          end;
          passed := case operation
            when 'own_select' then state is null and affected=1
            when 'foreign_select' then state is null and affected=0
            when 'foreign_insert' then state='42501'
            when 'owner_reassignment' then state='42501'
            else state is null and affected=0 end;
          report := report || jsonb_build_array(jsonb_build_object('direction',leg,'table',table_name,'test',operation,'passed',coalesce(passed,false),'sqlstate',state));
        end loop;
      end loop;

      state := null;
      passed := false;
      begin
        snapshot := public.ledger_snapshot_v2();
        passed := not exists(select 1 from jsonb_array_elements(snapshot->'categories') r where r->>'user_id'<>actor::text)
          and not exists(select 1 from jsonb_array_elements(snapshot->'transactions') r where r->>'user_id'<>actor::text)
          and snapshot->'settings'->>'user_id'=actor::text
          and exists(select 1 from jsonb_array_elements(snapshot->'categories') r where r->>'id'=own_category)
          and exists(select 1 from jsonb_array_elements(snapshot->'transactions') r where r->>'id'=own_tx);
      exception when others then state := sqlstate;
      end;
      report := report || jsonb_build_array(jsonb_build_object('direction',leg,'test','snapshot_isolation','passed',coalesce(passed,false),'sqlstate',state));
    end loop;
    -- All fixtures, audit timestamp changes, SET ROLE and request claims roll back.
    raise exception using errcode='PZ002',message='FINANX rollback fixtures';
  exception when sqlstate 'PZ002' then null;
  end;
  insert into pg_temp.finanx_v2_rls_report values(report);
end;
$verify$;

select
  count(*) as total_checks,
  count(*) filter(where (r->>'passed')::boolean) as passed_checks,
  bool_and((r->>'passed')::boolean) as all_passed,
  coalesce(jsonb_agg(r) filter(where not (r->>'passed')::boolean),'[]'::jsonb) as failed_checks,
  'Database role/claims simulation; not JWT validation or API transport' as scope,
  'All probe and fixture writes rolled back' as data_changes
from pg_temp.finanx_v2_rls_report,
  lateral jsonb_array_elements(result) r;
