# FINANX — Design System & UX Extension v2.0.0

**Status:** FINAL UX/DESIGN SPECIFICATION — approved for implementation handoff; running-UI validation required  
**Tanggal:** 22 Oktober 2026  
**Immutable baseline:** `DESIGN-v1.md` — *The Stamped Register*  
**Primary contract:** `REQUIREMENTS-v2.md` and resolved decisions §14

## 1. Creative north star: the same book, more readable pages

**V2 does not redesign FINANX.** Users should still feel they open a physical financial register: one ruled paper surface, ink rules, stamped recording action, calm typography and uncluttered flow. V2 improves what the ledger **explains** (comparison, trend, cumulative values), how quickly it can be **filled** (reuse history), how it can be **navigated** (month/year, drill-down), and how a record can be **taken away** (CSV).

**Non-negotiable V1 tokens** (unchanged): register paper `#f2f1ec`, raised paper `#f7f6f2`, tan `#e8e4da`, ink `#191918`, slate `#4a5b6b`, stamp red `#c22f1d`, rule `#b9b6a9`, soft rule `#d3d0c4`; IBM Plex Mono for financial figures and chrome, Inter for prose, tabular numerals; stamp red reserved for action/confirmation/focus; income ink, expense slate; corners 1–2px; hairline dividers and 2px section closes; double underline below monthly saldo; avoid floating cards and decorative shadows. Maintain V1 responsive shell, <900px mobile layout (bottom tabs and FAB), >=900px desktop/sidebar, and V1 bottom sheet vocabulary.

This document specifies **additions** to existing components, not replacements. All V1 screens and controls stay recognizable.

## 2. Information architecture (no new top-level navigation)

```text
Dashboard
  Month header (prev / month-year picker / next / current)
  Monthly summary (V1 + comparison microcopy)
  Income vs Expense (V1)
  Six-month trend (NEW, always visible)
  Category breakdown (V1 + historical comparison)
  Cumulative readout (NEW, secondary)
  → contextual links to filtered Transactions

Transactions
  Year + Month + Type + Category + Search + pagination
  → active transaction actions: Edit / Delete / Catat Lagi
  → Export Data sheet: filtered / all active
  FAB → Add Transaction sheet → Gunakan Riwayat picker

Profile
  → Pengaturan Keuangan → Saldo Awal (optional value + effective date)
```

**Placement clarification:** The cumulative readout is secondary to the V1 three-cell summary, but its exact vertical position relative to trend/category section should be validated via mobile prototype; do not insert a fourth equal-weight metric into the V1 plate. All sections are transparent ruled ledger blocks.

## 3. Dashboard Balanced Insight (V2-DASH)

### 3.1 Monthly head & summary

Retain V1 month navigation and the three-cell summary for pemasukan (ink), pengeluaran (slate), saldo bulanan (ink with tan plate + double underline). Add concise one-line delta under income/expense (absolute value and % when denominator > 0), with plain text `Naik/Turun`, neutral glyph/arrow, and explicit comparison month. Do **not** encode good/bad as green/red. Mobile values may wrap in each cell, but must remain exact and not horizontal-scroll. Label saldo distinctly **Saldo Bulanan**, never *Uang Tersedia*.

- **Past months:** comparison to previous full calendar month.
- **Current month:** same full-month comparison with *Bulan berjalan · Sementara*. Detail action `Bandingkan periode setara` expands in the same ledger section/sheet, showing both actual date ranges and shortened comparator if needed.
- **Future months:** retain all recorded totals, label *Periode mendatang*, **suppress comparison percentages**; no financial verdict.
- Missing comparison denominator: display amount change, dash or `Tidak tersedia` for percent; never `Infinity`, `NaN`, invented percentages or moral labels.

### 3.2 Six-month trend — ALWAYS visible

Add one register section **TREN KEUANGAN / 6 BULAN** below V1 income/expense counterforce. Two series on a shared, honest axis: income in ink, expense in slate; fine ruled gridlines and compact mono month labels. Use lines and small points, no filled gradients, neon palette, floating analytic cards or redundant third balance series. Trend is six **calendar** months ending with selected month, including zeros with explanation *Tidak ada transaksi tercatat*. Distinguish future month points/segments by dashed stroke and text/legend, not hue alone. Include precise values via accessible chart summary or data inspection, and retain a textual alternative if SVG/canvas interaction is difficult on Android.

**Motion:** calm, optional/minimal, respect reduced-motion; no animation necessary for comprehension. Avoid clipping chart labels on narrow screens. Do not treat future/month-in-progress as definitive results.

### 3.3 Category breakdown and contextual navigation

Preserve V1 expense/income groupings and bar treatment. Primary sort by current selected-month contribution. Add secondary small comparison text (`+Rp...`, `−Rp...`, and `%` where valid) without competing with amount. A *perbandingan* detail can include categories recorded only in prior month (now Rp 0); keep inactive category name visible for historical reads. Contextual action `Lihat Transaksi` on monthly income, expense and category rows routes to the Transactions page with period/type/category prefilled. Do not add click-to-drill on cumulative readout or individual trend points in this scope.

## 4. Cumulative balance (V2-BAL)

Present as a subordinate ruled strip/section, distinct from V1 monthly saldo. Two states:

- **Configured:** label `Saldo Kumulatif`, show exact IDR and footnote `Sejak [date] · berdasarkan transaksi tercatat`. Applies only to selected months containing or after effective date. For earlier selected months show em dash/`Belum tersedia` and an explanation naming the effective date.
- **Unset:** label `Akumulasi Transaksi`, sum history through selected month, with microcopy `Tanpa saldo awal · bukan total dana tersedia`; showing zero is permissible when no transactions exist, not an assertion of actual wealth.

Never label as bank balance, wallet balance or available cash. Amount may be negative based on net transactions even though **opening balance input** is restricted to >=0; maintain exact digits and minus sign.

### 4.1 Financial settings in Profile

`Profil → Pengaturan Keuangan → Saldo Awal` opens an in-page ruled section or existing V1-style sheet (the lower-friction existing pattern wins in actual UI audit). Fields: `Nominal saldo awal (IDR)` (integer 0..999999999999999) and `Tanggal mulai` (date-only, future allowed). Date and amount must be provided together for a configured setting; both absent means unset. Helper text: `Saldo sebelum transaksi pada tanggal mulai. Transaksi sejak tanggal ini dihitung ke saldo kumulatif.` Summarize effect in read-only preview, especially for mid-month dates. Create action `Simpan Saldo Awal`; before **update** show old/new value + dates and `Batalkan / Konfirmasi Perubahan`; before **reset** show what is removed and explicitly reassure transactions remain. Reset clears both fields; never deletes transactions. Use V1 underline inputs, inline stamp-deep errors, low-noise standard stamp/red primary actions and keyboard-focus design.

## 5. Smart Transaction Entry (V2-STE)

### 5.1 Two entry points, single create form

- **History action:** `Catat Lagi` on active transaction. On Android place in a discoverable accessible transaction actions menu (alongside V1 edit/delete), not a hover-only affordance; on desktop preserve existing patterns and keep repeated actions grouped.
- **Existing red FAB:** opens ordinary Add Transaction sheet unchanged, with a secondary action `Gunakan Riwayat`. **Do not open history automatically**; manual entry retains V1 number of required steps.
- `Gunakan Riwayat` swaps to a **history picker view inside the same sheet**, not another modal. Search by description or category name; newest first; display category, description, date and exact amount; 10 initial results then load more. Selecting a row returns to the same form with values filled. The source record never changes.

### 5.2 Draft and back navigation

Normalize `type`, integer amount, category id, description, and date for dirty-state comparison. `Catat Lagi` prefill at opening is **clean baseline**, not dirty. If user edits then restores baseline, closing is clean; if draft differs, show a short confirm `Buang perubahan?` with `Kembali Mengedit` (safe default) and `Buang Perubahan`. Cancel does not clear values. Selecting history while an edited draft would be overwritten triggers `Gunakan data riwayat / Pertahankan isian`; keep explicitly chosen date. Returning from history picker with internal Back/Android Back must preserve draft. Do not save until user presses **Simpan**; prevent parallel save presses and keep the draft visible on uncertain network outcome. Do not promise draft persistence across app closure/refresh (out of scope).

### 5.3 Categories and date

Prefill source type, integer amount, description and **active** source category. If category was deleted, show required category selector unfilled and a clear short message. Default new transaction date to local today, *not* original transaction date, unless the user explicitly set a date in draft. Both past and future remain allowed by V1. Reused transaction is a new independent record (no duplicated ID or 'recurring' status).

## 6. Historical Navigation (V2-HNAV)

### 6.1 Dashboard month/year picker

Keep existing prev/next controls and `Kembali ke bulan ini`. Month-year label gets a visible period-selection affordance; picker lists 12 months and a year selector, including future periods. Maintain V1 paper/rules and mechanical corners. Selecting period updates all visible dashboard sections (summary/trend/category/cumulative) as one coherent state. Avoid forcing repetitive month taps to reach earlier years.

### 6.2 Transactions filters and contextual drill-down

Add **Tahun** selection alongside V1 **Bulan**. `Semua Bulan` means all twelve months **in selected year**. V1 type, category, and search continue to compose. Hide neither active filter nor reason for empty results. Filter changes reset to page 1. URL query parameters hold validated `year`, `month`, `type`, `category`, `q`, `page`, with safe `return` relative same-origin path for drill-down navigation. Dashboard → category leads to Transactions filtered for source year, month, type and category. Browser/Android Back restores the originating dashboard month/year; refresh keeps current URL state. Historical inactive categories can be displayed as **filter/read** labels, not create-category choices.

## 7. CSV Export (V2-EXP)

On Transactions page, add secondary action `Ekspor Data`, opening V1-style sheet titled `EKSPOR TRANSAKSI`. Two radio options: `Sesuai filter aktif` (show readable current filter summary; all matching rows across pages) and `Seluruh histori aktif`. Format is fixed `CSV (.csv)`, not a dropdown to unavailable PDF/XLSX. Primary action `Unduh CSV`; explicit user click required. For no records, show `Tidak ada transaksi untuk diekspor` and no file. On running export, show busy state and block duplicate activation; on failed/unsafe consistency result, show recoverable error and retry. For success, let browser download or save with an informative filename; keep private financial data warning low-key. Do not claim export is a backup/restore file.

CSV body is fixed: `date,type,category,description,amount` with IDR integers and all active records of chosen scope. UX is responsible for making scope clear; CSV escaping, formula neutralization and cloud snapshot integrity are defined by `REQUIREMENTS-v2.md` §14.5 and `DATA-MODEL-v2.md` §9.

## 8. Design system extensions (only what V2 needs)

| Element | Existing V1 language | V2 extension |
|---|---|---|
| Monthly summary | 3 cells, ruled, saldo double-underlined | compact secondary monthly comparison lines; preserve hierarchy |
| Trend section | ruled ledger region | 2 thin ink/slate strokes + grid lines + labels, always visible |
| Category rows | icon + amount, hairline divider | small historical delta and optional `Lihat Transaksi` |
| Transaction row actions | edit/delete chips | discoverable `Catat Lagi`, accessible on touch |
| Add Transaction sheet | bottom sheet w/ underline fields | secondary `Gunakan Riwayat` and internal picker screen |
| Period header | prev/next/current | tap/click month-year text opens direct period picker |
| Filters | V1 month/type/category/search | year selection, safe context restoration |
| Profile | V1 account/profile ledger | ruled `Pengaturan Keuangan → Saldo Awal` |
| Exports | not present | `Ekspor Data` secondary action + scoped CSV sheet |

**Color semantics:** income ink and expense slate everywhere; no red/green sign-of-performance marks. Stamp red only for action/confirmation/focus, not values or trends. Do not introduce floating card grids, soft SaaS backgrounds, excessive rounded pills or new font hierarchy.

## 9. Mobile interaction, accessibility, responsiveness

- **Android Chrome is the primary validation context**; desktop remains supported. V1 shell breakpoint 900px remains unchanged unless testing proves a compatible maintenance adjustment is necessary.
- Verify at 360 CSS px viewport: no horizontal page scroll; correct reading of large IDR numbers, long category labels, six-month chart ticks, dropdowns and sheets; wrap content or use compact figures only for *axis labels* (never change displayed exact amount).
- Critical touch targets ~44 × 44 CSS px or effective equivalent. No hover-only actions. Tab/shift-tab and screen-reader accessible names for picker/back, date selection, drill-down, chart, export and confirmation actions.
- When picker view changes, move focus to appropriate heading/search; on return, restore sensible focus without opening keyboard unexpectedly. Android Back with virtual keyboard should not accidentally dismiss and discard the whole form; apply dirty-close policy for any attempted sheet dismissal.
- Maintain logical field labels, descriptive empty/error states, contrast according to V1 palette, tabular numerals and reduced-motion support. Show `loading`, `empty`, `error`, `success`, `disabled` states without fabricated success confirmations.

## 10. UX state matrix

| Area | State | Expected behavior / microcopy |
|---|---|---|
| Dashboard | selected month is future | full recorded totals; `Periode mendatang`; no comparison % |
| Dashboard | selected month is current | `Bulan berjalan · Sementara`; aligned-period detail available |
| Dashboard | no comparator or zero denominator | amount delta, percentage absent |
| Trend | month without records | point at 0; `Tidak ada transaksi tercatat` caveat |
| Balance | opening unset | `Akumulasi Transaksi`; no claim total money |
| Balance | before opening effective date | `Belum tersedia` and start date note |
| Balance | editing/removing opening setting | confirmation before mutation; no transaction deletion |
| Smart Entry | initial history prefill | clean baseline; close without confirmation unless later edited |
| Smart Entry | changed draft | confirm before discard or replacement |
| Smart Entry | source category inactive | blank required category selector with explanation |
| Smart Entry | save unknown/failure | retain draft; no false confirmation or duplicated create |
| History | invalid URL filter | normalize safely and show controlled UI |
| History | filtered empty | meaningful empty state with filters visible |
| CSV | empty result | no file, explanatory message |
| CSV | exporting / failure | progress/busy, then success or recoverable failure; no partial success |

## 11. Interaction and content writing rules

- Speak factually: `Pengeluaran tercatat naik...`, not `Anda boros...` or predictions.
- Comparisons always name relevant month/date ranges. Distinguish active monthly total from aligned-day details.
- A balance calculated from transactions is not the amount in a bank account.
- Use consistent Bahasa Indonesia labels; V1 also supports English, so add parallel translations for **all** new V2 messages, statuses, controls and accessibility names. Preserve exact CSV headers in English independent of UI locale.
- Screen-reader chart text must announce month, income and expense exact values, including no-record and future-period context.

## 12. Acceptance / review checklist

- [ ] V1 Stamped Register visual tokens, 3-cell summary, FAB, desktop sidebar and mobile tabs remain intact.
- [ ] Six-month trend visible without extra action and readable at 360px; no new graph colors.
- [ ] Historic/month-in-progress/future comparisons use accurate copy and correct visibility.
- [ ] Monthly saldo remains primary; cumulative/accumulated readout is clearly distinct and secondary.
- [ ] Opening balance form accepts zero/future date, validates pair, confirms update/reset.
- [ ] `Catat Lagi` and `Gunakan Riwayat` reuse same create form; no autosave; dirty semantics conform to §14.2.
- [ ] Back Android/picker preserves draft; close dirty prompts; clean prefill does not prompt.
- [ ] Year/month filter and Dashboard drill-down restore contexts across browser Back/refresh.
- [ ] Soft-deleted historic category visible for read/export but not active new entry.
- [ ] Export UI explains two scopes and never promises all rows when only pagination page is loaded.
- [ ] Touch/keyboard/focus/screen-reader and ID/EN strings verified.
- [ ] Responsive/browser behavior verified against actual V1 components, not just mockups.

## 13. Open verification gates (not new scope)

1. Inspect running V1 UI before final spacing/placement, especially summary, FAB/menu action touch affordance, sheet dismissal and profile sections.
2. Validate component-level ARIA patterns, responsive line wraps and chart accessibility on Android Chrome 360px/desktop.
3. Verify router/browser Back handling, focus restoration and sheet state in implementation.
4. Verify network/loading messages match actual save/export semantics and that all strings are localized.
5. Benchmark 10k-transactions workload and user-facing responsiveness against `REQUIREMENTS-v2.md` §14.6.

Changes at these gates can adjust implementation or spacing, but should **not** silently change agreed user-facing rules or V1 baseline.

## 14. Traceability and status

- `DESIGN-v1.md`: single source for palette, typography, geometry, elevation, layout, visual direction.
- `REQUIREMENTS-v2.md`: feature approval and decisions O-01–O-06, including concrete behavior and test targets.
- `DATA-MODEL-v2.md`: new settings data contract, money/date correctness, URL filters and CSV security.
- V2 feature discovery docs: dashboard, smart transaction, cumulative balance, historical navigation and export data.

**Status:** final for implementation handoff, subject to UI audit and validation gates. **No V1 design file has been modified.**

## 15. Final review UX clarifications

- For **Dashboard future months**, show full recorded nominal totals but **no comparison percentage**; do not mislabel a future amount as already received/spent.
- For **opening balance**, preserve three-cell monthly summary. On selected months before the effective date show `Belum tersedia`; on unset configuration show `Akumulasi Transaksi` with appropriate caveat.
- For **Smart Entry**, a prefilled `Catat Lagi` form starts **clean**, even though it contains values; only later user changes trigger dirty-close confirmation. Picker navigation does not dismiss the form.
- For **CSV**, the scope control must explicitly say all matching rows across pagination; privacy and download failure states must be unambiguous.
- Preserve **ID/EN localization** and *The Stamped Register* style; avoid new routes/top-level navigation unless strictly required by audited V1 architecture.
