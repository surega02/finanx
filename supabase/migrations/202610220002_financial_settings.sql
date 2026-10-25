-- V2 additive migration. Run once using the versioned migration runner after V1.
begin;

create table public.financial_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  opening_balance_amount bigint,
  opening_balance_date date,
  updated_at timestamptz not null default now(),
  constraint financial_settings_amount_range check (opening_balance_amount between 0 and 999999999999999),
  constraint financial_settings_paired_fields check (
    (opening_balance_amount is null) = (opening_balance_date is null)
  )
);
alter table public.financial_settings enable row level security;
create policy financial_settings_select_own on public.financial_settings for select to authenticated using (auth.uid() = user_id);
create policy financial_settings_insert_own on public.financial_settings for insert to authenticated with check (auth.uid() = user_id);
create policy financial_settings_update_own on public.financial_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy financial_settings_delete_own on public.financial_settings for delete to authenticated using (auth.uid() = user_id);
revoke all on public.financial_settings from public, anon;
grant select, insert, update, delete on public.financial_settings to authenticated;

create function public.financial_settings_timestamp_v2() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger financial_settings_timestamp before insert or update on public.financial_settings
for each row execute function public.financial_settings_timestamp_v2();

-- One SQL statement => one MVCC snapshot, including categories and settings.
-- Scalar JSON avoids PostgREST row limits. Send bigint as decimal text.
create function public.ledger_snapshot_v2() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'categories', coalesce((select jsonb_agg(to_jsonb(c)) from public.categories c where c.user_id = auth.uid()), '[]'::jsonb),
    'transactions', coalesce((select jsonb_agg(to_jsonb(t) || jsonb_build_object('amount', t.amount::text)) from public.transactions t where t.user_id = auth.uid()), '[]'::jsonb),
    'settings', (select to_jsonb(s) || jsonb_build_object('opening_balance_amount', s.opening_balance_amount::text) from public.financial_settings s where s.user_id = auth.uid())
  );
$$;
revoke all on function public.ledger_snapshot_v2() from public, anon;
grant execute on function public.ledger_snapshot_v2() to authenticated;
commit;
