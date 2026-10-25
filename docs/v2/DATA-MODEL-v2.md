# FINANX — Data Model v2.0.0

**Status:** FINAL DATA DESIGN — approved for implementation handoff; deployed-schema validation required  
**Tanggal:** 22 Oktober 2026  
**Baseline frozen:** `DATA-MODEL-v1.md` / `SUPABASE-v1.md`  
**Primary contract:** `REQUIREMENTS-v2.md`, especially §§2–10 and 14.1–14.6  
**Target schema version:** 2

## 1. Tujuan dan ruang lingkup

V2 mempertahankan domain V1 `User → Categories → Transactions → Monthly Summary`. Hanya **opening balance settings** yang menambah data persisten. Dashboard Balanced Insight, Smart Transaction Entry, Historical Navigation, dan CSV Export merupakan **derived views/workflows** atas data V1; tidak memperkenalkan wallet, transfer, template/favorite, recurring schedule, budget, analytics cache, saldo per rekening, atau tabel ekspor.

**Aturan precedence:** keputusan eksplisit pada `REQUIREMENTS-v2.md` §14 mengungguli label *proposed* lama pada bagiannya. Dokumen ini adalah desain teknis yang perlu diaudit terhadap kode dan skema sebenarnya; bukan pernyataan migrasi telah dijalankan.

## 2. Perubahan domain (diff terhadap V1)

```text
Auth User
├── Profile             [V1 unchanged]
├── Category[]          [V1 unchanged]
├── Transaction[]       [V1 unchanged]
└── FinancialSettings?  [V2 NEW, 0..1 per user]
      ├── user_id
      ├── opening_balance_amount: bigint | null
      ├── opening_balance_date: date | null
      └── updated_at: timestamptz

Derived, NOT stored:
- MonthlyTotals(month): income, expense, monthly_net
- ComparableTotals(month, previous_month, aligned_period)
- SixMonthTrend(selected_month)
- CategoryTotals(month, category_id, type)
- AccumulatedTransactions(end_month) [if opening balance unset]
- CumulativeBalance(end_month) [if opening balance set]
- FilteredHistory(year/month/type/category/q/page)
- CSVExport(filtered | all_active)
```

V1 invariants: `amount > 0`, `type in ('income','expense')`, `date` is `YYYY-MM-DD` (past/present/future), soft deletion (`deleted_at`), no change to V1 primary keys or foreign keys, financial calculations use **active transactions only**, and all cloud records are owner-scoped.

## 3. Cloud schema additions: `public.financial_settings`

| Column | PostgreSQL type | Rules |
|---|---|---|
| `user_id` | `uuid` | PRIMARY KEY; FK `auth.users(id)` ON DELETE CASCADE; owner |
| `opening_balance_amount` | `bigint` | nullable; when present integer IDR from `0` through `999999999999999` |
| `opening_balance_date` | `date` | nullable; when present required; future dates allowed |
| `updated_at` | `timestamptz` | NOT NULL, default `now()`; maintain on updates |

**Invariant:** amount/date are either **both NULL** (not configured) or **both NOT NULL** (configured). Explicit amount `0` is configured and must not be confused with unset. No mandatory row for existing users; a missing row reads as unset. Reset is an **atomic update to both NULL** (retain the row for stable upsert semantics); user deletion is handled through FK cascade. Do not model opening balance as an income transaction: doing so would corrupt monthly income and category insights.

### 3.1 Proposed migration SQL (review against deployed schema first)

```sql
-- Migration: 002_add_financial_settings.sql
-- Applies after v1 schema. Review role grants and timestamps in deployment pipeline.
BEGIN;

CREATE TABLE IF NOT EXISTS public.financial_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  opening_balance_amount bigint NULL,
  opening_balance_date date NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_settings_amount_range CHECK (
    opening_balance_amount IS NULL OR
    opening_balance_amount BETWEEN 0 AND 999999999999999
  ),
  CONSTRAINT financial_settings_paired_fields CHECK (
    (opening_balance_amount IS NULL AND opening_balance_date IS NULL) OR
    (opening_balance_amount IS NOT NULL AND opening_balance_date IS NOT NULL)
  )
);

ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_settings_select_own ON public.financial_settings
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY financial_settings_insert_own ON public.financial_settings
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY financial_settings_update_own ON public.financial_settings
FOR UPDATE TO authenticated USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY financial_settings_delete_own ON public.financial_settings
FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_settings TO authenticated;
COMMIT;
```

**Migration note:** This is a proposed *new-table* migration, not an idempotent policy migration: `CREATE POLICY` fails on rerun. Use a versioned migration runner with exactly-once execution, or explicitly guard policy creation. `IF NOT EXISTS` alone is not a safe schema-reconciliation mechanism. On update, set `updated_at = now()` in the owner-scoped server operation (or reuse an audited trigger pattern); do not trust a client clock for auditing. No secondary index is needed because the PK indexes `user_id` and all reads are one-record owner lookups. FK/PK are not modified on V1 tables.

### 3.2 Ownership and security contract

- `auth.uid() = user_id` for reads, inserts, updates and deletes. Test unauthorized `SELECT`, `INSERT`, `UPDATE`, `DELETE` and attempted owner reassignment with two real authenticated identities.
- Supabase anon/public client key may be frontend-visible only together with working RLS; never expose service-role credentials.
- Client requests must never trust an arbitrary `user_id` from URL/inputs; derive owner from authenticated session. Avoid account cross-contamination on sign-in/out and caching.
- V1 `profiles`, `categories`, and `transactions` RLS policies remain in place; do not weaken them to implement history search or export.

## 4. Demo state v2 and migration

V1 key: `localStorage['finanx:v1']`. V2 uses **a distinct versioned key**, e.g. `finanx:v2`, that copies/parses the V1 domain state via an explicit tested adapter and adds:

```json
{
  "schemaVersion": 2,
  "financialSettings": {
    "openingBalanceAmount": null,
    "openingBalanceDate": null
  }
}
```

Shape above is **new fields only**, not the complete V2 root-state format: preserve actual V1 field names/structures after auditing the implemented store. Prefer storing integer amounts as strings if the serializer cannot guarantee range-safe integer roundtrips; hydrate with lossless parsing. The V1 key is preserved during rollout for rollback and is never overwritten with an incompatible V2 object. No automatic merging of demo data into cloud.

Migration flow: detect valid V2 → use V2; else read and validate V1 → copy unchanged user/category/transaction records → attach `financialSettings` unset → persist V2 atomically to a separate key → re-read/validate before setting migration successful. If parse/quota/migration fails, do **not** delete V1; show recoverable failure and avoid destructive fallback. Schema version 2 is required for all new writes. Data seeded in demo must remain isolated from real cloud accounts.

## 5. Date-only and money precision

- Store and filter transaction dates as **date-only**, never convert `YYYY-MM-DD` through UTC for month grouping. Determine current local date for today-based UI comparison and Smart Entry default.
- Month interval: `[first_day_of_month, first_day_of_next_month)`; aligned detail: inclusive first day through current local date and comparator's capped day.
- Money is integral IDR. Cloud `bigint` values may be returned as string; parse without lossy floating conversion. Enforce opening balance input within 15-digit approved range; sums over large histories may exceed JavaScript safe integer. Use safe integer checks and BigInt/decimal-string arithmetic for exact aggregate calculations; convert to display strings, not fractional floats. Avoid using BigInt directly inside JSON.
- Category joins must match both `user_id` and `category_id` consistent with composite V1 FK. Historic soft-deleted category is readable for aggregates, drill-down filters and CSV, but **not** selectable for a new transaction.

## 6. Derived calculations (no persistent cache)

Define `signed_amount(t) = +amount if income, -amount if expense` and `active(t) = deleted_at IS NULL`.

**Monthly:**

```text
income(M)  = SUM(amount WHERE active AND type=income  AND date ∈ M)
expense(M) = SUM(amount WHERE active AND type=expense AND date ∈ M)
net(M)     = income(M) - expense(M)
```

**Configured opening balance** (`B` and effective date `D`, month ending at exclusive `nextMonth(M)`):

```text
cumulative(M) = B + SUM(signed_amount(t)
                        WHERE active(t)
                          AND D <= t.date < nextMonth(M))
```

Only show cumulative(M) when the selected month contains `D` or follows it. Months entirely preceding `D` show `Belum tersedia`, not `0`. Mid-month D excludes earlier transactions from cumulative but leaves all monthly reports unaffected. Future-effective D uses the same rule.

**Unset opening balance:** label **Akumulasi Transaksi**; sum all active `signed_amount(t)` with dates before `nextMonth(M)`. No claim to total assets or spendable money. Explicit opening balance 0 uses the configured-balance rule and label.

**Comparison/trend:** previous month is calendar previous (including year rollover). For income/expense percentage delta, compute `(selected-previous)/previous * 100` **only if previous > 0**; report absolute delta otherwise. Aligned-period detail available only for current local month and excludes transactions after today even though the full month total includes them. Trend includes exactly six calendar months ending at selected month, retaining zero-record months with an explicit caveat. Future month percentage comparisons are hidden; future points marked distinctly. For negative/zero net, avoid misleading percentage interpretation.

**Category aggregates:** group by stable category identifier + type (not solely display name); retain soft-deleted historical categories when they back active transactions. In breakdown main list, follow current-month contribution; comparison detail can include previous-only category with selected amount zero.

All views share the same aggregation utilities. Edit/delete/undo/category change/date change invalidate affected derived values; do not persist totals as an authoritative ledger balance.

## 7. Smart Transaction Entry: no schema change

- `Catat Lagi` or `Gunakan Riwayat` read **active owner-owned** historical transactions (sorted date descending then creation timestamp descending, 10 initially with load-more). A new entry is a **regular V1 transaction** with new ID; source remains untouched.
- Prefill `type`, `amount`, `description` and active category. For inactive category require replacement. New date defaults to local today unless user explicitly selected a date in the existing draft. No automatic source date copy and no autosave.
- Dirty baseline is the initial normalized form state; prefilling during initial `Catat Lagi` establishes a **clean baseline**. Picker selection later counts as dirty if it changes effective values. Confirm before overwriting an already-dirty draft; confirm close only if form differs from baseline. Draft is volatile UI state, not a new database table.
- Use stable client-generated ID for **one** create intent and idempotent handling of cloud retries/unknown outcomes; recheck the same ID on uncertain failure. Never generate a second ID for a retry of the same action. Intentional separate identical transactions are valid. Need audit V1 upsert semantics and ID generation before implementation signoff.

## 8. Historical Navigation: URL state, not database schema

Validated query parameters:

| Route | Parameters | Semantics |
|---|---|---|
| Dashboard | `year`, `month` | selected calendar period |
| Transactions | `year`, `month`, `type`, `category`, `q`, `page` | filters and pagination; `month=all` means all months of selected year |
| Contextual drill-down | above + `return` | relative same-origin Dashboard route for browser/Android Back |

Reject/normalize invalid year/month/page/type/category (owner/category membership validation), avoid open redirects (verified internal relative return URL), reset page to 1 on filter changes. Restore period on browser Back/refresh; new primary-navigation Dashboard visit may apply V1 default. Include historic inactive categories as *read filters* but never as create options. Avoid adding query filters to store, and do not persist transient navigation state in user database.

## 9. CSV Export: read-only derived artifact

Two scopes: all active rows matching current transaction filters (regardless of UI page) or all active owner rows over all time. Sort date desc then created_at desc. Fixed header `date,type,category,description,amount`, UTF-8 BOM, comma, CRLF, integer digit strings; no account/export table. Include future-dated active rows. Resolve historic category names safely (demo snapshot fallback, otherwise explicit missing-category label).

Quote/escape CSV according to CSV rules and neutralize spreadsheet formula injection in `category`/`description` including leading whitespace/control before `=,+,-,@`; test actual Excel and Google Sheets behavior. Preserve original DB data; treat CSV as protected analytical copy, not lossless backup. Use a **consistent server-side snapshot** or a proven version/change-detection protocol for cloud exports so concurrent edits cannot silently create missing/duplicate rows. **A row count before/after is not sufficient**, because edits may preserve count. If an adequate consistency guarantee cannot be built, fail clearly and offer retry; never mark a partial or inconsistent file as successful. Empty result gives notice, not a file. File generation must require explicit user action and cannot bypass RLS.

## 10. Indexes, queries, and performance strategy

Existing V1 indexes: `transactions(user_id, date DESC)` and `categories(user_id, type)`. Begin with these; use `EXPLAIN (ANALYZE, BUFFERS)` against representative data before introducing additional indexes. **Optional** partial index for repeatedly filtering active transactions might be evaluated after benchmarks (e.g. `(user_id, date DESC, created_at DESC) WHERE deleted_at IS NULL`), but is **not** an approved mandatory migration. Search matching category name may need owner-scoped join; never remove RLS filters for speed.

Performance test: 10,000 active transactions, 100 categories, 5 years; Android Chrome mid-range and desktop. Targets after data resident in memory: Dashboard monthly navigation p95 <= 500ms, history filters p95 <= 500ms, picker/prefill p95 <= 300ms; separately measure network time. CSV full export must not freeze/crash; chunk responsibly but guarantee completeness. UI 360px viewport and ~44x44px tap targets.

## 11. Migration and rollback plan

1. **Preflight:** backup cloud; inspect deployed schema, RLS and actual local state shape. Check existing table/constraint names; audit clock/ID/int handling.
2. **Schema:** apply migration 002 through versioned migrations; verify RLS with two users and PK/FK pairing.
3. **App rollout:** ship read-compatible app with feature detection/controlled rollout; unset if no `financial_settings` record. Preserve all V1 rows and UI flows.
4. **Demo:** validate non-destructive `finanx:v1` → `finanx:v2` copy, including seeded/default data, custom category snapshots and deleted records. Keep rollback key.
5. **Rehearsal:** test open balance `null` vs 0, mid-month/future, update/reset, cloud session switch, retry unknown outcome, data aggregation parity and 10k records.
6. **Rollback:** disable V2 features and return to V1-compatible app, leaving new table in place (do not drop user settings/data during hot rollback); do not roll back by reverting V2 new transactions out of the V1 tables. V1 app must ignore new config. For demo, **warn** that V1 rollback key is an older snapshot and may not include transactions added after migration: devise a reversible export/merge plan before making rollback user-visible; do not silently discard V2-era data.

No automatic backfill for opening balance; missing settings means unset. Versioned SQL migration and rollback rehearsal are release gates; destructive schema resets prohibited.

## 12. Verification matrix and unresolved implementation checks

| Check | Expected |
|---|---|
| Two cloud identities | each can read/write only own settings, transactions, categories |
| No setting / explicit 0 | distinguish unset from valid 0 |
| Effective date inside month | cumulative excludes earlier days; monthly net unchanged |
| Effective date in future | earlier cumulative unavailable; future month uses matching records |
| Set/update/reset settings | update/reset confirms; writes atomic; derived totals refresh |
| Edit transaction before vs after D | prior edit does not affect configured cumulative; later edit does |
| Soft delete / undo | every derived metric recalculates correctly |
| January / year rollover | correct inclusive/exclusive periods and navigation |
| Source category soft-deleted | read and export preserved; Smart Entry demands active category |
| Failed/unknown save | retain draft, stable ID, retry without accidental duplicate |
| Cloud CSV large export | no pagination truncation, no missing/duplicated rows |
| CSV injection samples | spreadsheet apps do not evaluate injected formulas |
| Android 360px / 10k rows | meets §14.6 accessibility/performance gates |

**Technical gates still open:** audit deployed RLS grants/policies, V1 localStorage root schema, date parser, handling of PostgreSQL bigint in Supabase client, transaction create ID stability, cloud export snapshot approach, router query/back behavior, and measured performance. These are verification tasks, **not** scope expansions or permission to change approved product rules.

## 13. Traceability

- `REQUIREMENTS-v2.md`: §§4/14.3 (Dashboard), §§5/14.2 (Smart Entry), §§6/14.1 (Balance), §§7/14.4 (History), §§8/14.5 (Export), §14.6 (quality gates).
- `DATA-MODEL-v1.md`: core V1 schema, ownership and date-only semantics, unchanged.
- `SUPABASE-v1.md`: authentication and v1 RLS setup, unchanged.
- `V2-SCOPE-REVIEW.md`: inclusion/exclusion context.

**Document status:** final data design for implementation handoff, subject to technical validation gates; no migration has been executed. It does not claim migration SQL or application code has been executed.

## 14. Final review clarifications

1. **Opening-balance state:** missing `financial_settings` row and pair `(NULL, NULL)` mean unset; explicit `(0, date)` means configured. Reset must be atomic. Neither reset nor date changes mutates any V1 transaction.
2. **First-load and rollback:** migrate demo from actual audited `finanx:v1` shape into `finanx:v2`; keep V1 key as migration snapshot, **not** continuously synced. Prior to demo rollback, export or safely reconcile post-migration V2 transactions or pause rollback; never silently show old V1 snapshot as current.
3. **Long history:** `sum` must be exact for signed IDR amounts and not pass through a lossy floating-point number. SQL bigint / JS BigInt encoding and serialization need explicit tests.
4. **Cloud export:** a count-only comparison cannot detect concurrent same-count updates. Build consistent-snapshot export, or a tested change/version protocol with failure-on-mutation; this is an implementation gate, not a new feature.
5. **SQL migration:** the SQL above is a proposal requiring deployment schema/privilege review and an exactly-once migration runner. Only the reviewed migration may be executed.
