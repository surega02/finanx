import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import * as ledger from '../src/lib/ledger.js';
import * as format from '../src/lib/format.js';
import { makeCSV, csvText } from '../src/lib/csv.js';
import { parseNavigation, safeReturn, routeURL } from '../src/lib/navigation.js';

const cat = { id: 'food', type: 'expense', name: 'Food', nameId: 'Makanan', icon: 'utensils', source: 'user' };
const tx = (id, date, amount = 100, type = 'expense', extra = {}) => ({ id, date, amount, type, category: cat, description: '', created_at: `${date}T01:00:00Z`, deleted_at: null, ...extra });
const state = () => ({ user: { uid: 'demo-uid' }, categories: [cat], transactions: [tx('a', '2026-01-01')], language: 'id' });
function harness(opts) {
  const cache = new Map();
  const storage = { getItem: key => cache.get(key) ?? null, setItem: (k, v) => cache.set(k, v), removeItem: k => cache.delete(k) };
  const compile = (path, modules, define) => {
    const code = transformSync(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), { format: 'cjs', define }).code;
    const sandbox = { module: { exports: {} }, require: name => modules[name], localStorage: storage };
    vm.runInNewContext(code, sandbox);
    return sandbox.module.exports;
  };
  const helpers = compile('../src/lib/supabase.js', { '@supabase/supabase-js': { createClient: () => null } }, { 'import.meta.env': '{}' });
  const { Store } = compile('../src/lib/store.js', { './format.js': format, './ledger.js': ledger, './supabase.js': helpers });
  return { Store, cache, storage, store: new Store(ledger.migrateDemo(state()), opts) };
}

test('V1 monthly future dates, soft delete, zero and cross-year comparisons remain exact', () => {
  const rows = [tx('a', '2025-12-31', 10, 'income'), tx('b', '2026-01-31', 30, 'income'), tx('c', '2026-01-01', 5), tx('d', '2026-01-02', 999, 'expense', { deleted_at: 'x' })];
  const d = ledger.insights(rows, 2026, 0, undefined, '2026-01-10');
  assert.equal(d.selected.balance, 25n); assert.equal(d.prior.income, 10n);
  assert.equal(d.aligned.selected.income, 0n); assert.equal(d.trend.length, 6);
  assert.equal(d.trend[0].monthIndex, 7); assert.equal(ledger.percent(10n, 0n), '');
  assert.equal(ledger.insights(rows, 2026, 0, undefined, '2025-12-10').future, true);
});
test('opening balance unset, zero, mid-month, future and reset do not mutate monthly ledger', () => {
  const rows = [tx('a', '2026-01-14', 1000, 'income'), tx('b', '2026-01-15', 30, 'income'), tx('c', '2026-01-16', 5)];
  const s = { openingBalanceAmount: '0', openingBalanceDate: '2026-01-15' };
  assert.equal(ledger.insights(rows, 2026, 0).cumulative, 1025n);
  assert.equal(ledger.insights(rows, 2026, 0, s).cumulative, 25n);
  assert.equal(ledger.insights(rows, 2025, 11, s).cumulative, null);
  assert.equal(ledger.insights(rows, 2026, 0, { ...s, openingBalanceDate: '2026-02-01' }).cumulative, null);
  assert.equal(ledger.insights(rows, 2026, 0, s).selected.income, 1030n);
  assert.throws(() => ledger.validateSettings({ openingBalanceAmount: null, openingBalanceDate: '2026-01-01' }));
  for (const amount of ['-1', '1.5', '1000000000000000']) assert.throws(() => ledger.validateSettings({ ...s, openingBalanceAmount: amount }));
  ledger.validateSettings({ ...s, openingBalanceAmount: '999999999999999' });
});
test('Bigint totals and CSV preserve PostgreSQL bigint without floating roundoff', async () => {
  const rows = [tx('a', '2026-01-01', '9223372036854775807', 'income'), tx('b', '2026-01-01', '9223372036854775807', 'income')];
  assert.equal(ledger.totals(rows).income, 18446744073709551614n);
  assert.ok((await makeCSV(rows, [cat])).includes('9223372036854775807'));
  assert.throws(() => ledger.integer(Number.MAX_SAFE_INTEGER + 1));
});
test('aligned comparator caps day in leap/non-leap February', () => {
  const d = ledger.insights([], 2026, 2, undefined, '2026-03-31');
  assert.equal(d.aligned.previousEnd, '2026-02-28'); assert.equal(d.aligned.shorter, true);
  assert.equal(ledger.insights([], 2024, 2, undefined, '2024-03-31').aligned.previousEnd, '2024-02-29');
  assert.equal(ledger.validDate('2026-02-29'), false);
});
test('V1 demo adapter preserves source and new writes; rollback projection retains V2-era rows', async () => {
  const { Store, cache } = harness();
  cache.set('finanx:demo:v1', JSON.stringify(state()));
  const original = cache.get('finanx:demo:v1');
  const store = Store.load();
  assert.equal(store.state.schemaVersion, 2); assert.equal(store.state.financialSettings.openingBalanceAmount, null);
  await store.saveTransaction({ type: 'expense', amount: 7, date: '2027-01-01', category: cat, description: 'new' }, 'stable');
  assert.equal(cache.get('finanx:demo:v1'), original);
  const reloaded = Store.load(); assert.equal(reloaded.state.transactions.length, 2);
  const rollback = ledger.projectDemoRollback(reloaded.state);
  assert.deepEqual(Array.from(rollback.transactions, t => t.id), ['stable', 'a']);
});
test('migration parse/quota failure preserves source instead of seeding over it', () => {
  for (const raw of ['{broken', JSON.stringify({ user: { uid: 'A' } })]) {
    const { Store, cache } = harness(); cache.set('finanx:demo:v1', raw);
    assert.throws(() => Store.load()); assert.equal(cache.get('finanx:demo:v1'), raw); assert.equal(cache.has('finanx:demo:v2'), false);
  }
  const { Store, cache, storage } = harness(); cache.set('finanx:demo:v1', JSON.stringify(state()));
  storage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => Store.load()); assert.ok(cache.has('finanx:demo:v1'));
});
test('manual create/edit/delete/undo and historical categories remain available with revision updates', async () => {
  const { store } = harness(); let revisions = 0; store.subscribe(() => revisions++);
  await store.saveTransaction({ type: 'expense', amount: 10, date: '2027-01-01', category: cat, description: '' }, 'new');
  await store.saveTransaction({ type: 'expense', amount: 20, date: '2027-01-02', category: cat, description: 'edit' }, 'new', true);
  await store.softDeleteTransaction('new'); assert.equal(store.summaryForMonth(2027, 0).expense, 0n);
  await store.undoDeleteTransaction('new'); assert.equal(store.summaryForMonth(2027, 0).expense, 20n);
  store.softDeleteCategory(cat.id);
  assert.equal(store.categoryTotals({ food: 20n }).length, 1);
  await assert.rejects(store.saveTransaction({ type: 'expense', amount: 20, date: '2027-01-02', category: cat, description: '' }, 'invalid'));
  assert.ok(revisions >= 5);
});
test('double save and uncertain cloud outcome reuse one ID without overwriting or duplicate inserts', async () => {
  const records = new Map(); let writes = 0; let unavailable = false;
  const client = { from() { let id; return {
    select() { return this; }, eq(key, value) { if (key === 'id') id = value; return this; },
    async maybeSingle() { return unavailable ? { error: { code: 'network' } } : { data: records.get(id) || null }; },
    async upsert(payload) { writes++; await new Promise(r => setTimeout(r, 10)); records.set(payload.id, payload); unavailable = true; return { error: { code: 'network' } }; },
  }; } };
  const { store } = harness({ supabase: client, userId: 'A' });
  const draft = { type: 'expense', amount: 50, date: '2026-10-01', category: cat, description: 'same' };
  const results = await Promise.allSettled([store.saveTransaction(draft, 'intent'), store.saveTransaction(draft, 'intent')]);
  assert.ok(results.every(r => r.status === 'rejected')); assert.equal(writes, 1); assert.equal(store.state.transactions.length, 1);
  unavailable = false;
  await store.saveTransaction(draft, 'intent'); assert.equal(writes, 1); assert.equal(store.state.transactions.length, 2);
  await assert.rejects(store.saveTransaction({ ...draft, amount: 51 }, 'intent'), /intentConflict/);
});
test('URL validation rejects external return, invalid filters; all months means chosen year', () => {
  const p = parseNavigation('?view=transactions&year=garbage&month=99&type=bad&category=other&page=-2', [cat]);
  assert.equal(p.type, 'all'); assert.equal(p.category, 'all'); assert.equal(p.page, 1);
  for (const target of ['https://evil.test', '//evil.test', '/\\evil.test', '/?view=profile', '/?view=dashboard#x']) assert.equal(safeReturn(target), null);
  const url = routeURL('dashboard', { year: 2025, month: 12 }); assert.equal(safeReturn(url), url);
  assert.equal(ledger.filterHistory([tx('a', '2025-12-31'), tx('b', '2026-01-01')], { year: 2025, month: 'all' }).length, 1);
});
test('CSV all rows including historic category, RFC quoting, BOM and formula neutralization', async () => {
  for (const input of ['=1+1', ' +CMD', '\t-CMD', '\r\n@SUM(1)', '\u0000=1']) assert.equal(csvText(input).replace(/^"/, '').startsWith("'"), true);
  const rows = Array.from({ length: 25 }, (_, i) => tx(String(i), '2026-01-01', i + 1, 'expense', { description: 'a,"b"\r\nc' }));
  const csv = await makeCSV(rows, [{ ...cat, deleted_at: 'x' }]);
  assert.ok(csv.startsWith('\uFEFFdate,type,category,description,amount\r\n'));
  assert.equal(csv.match(/2026-01-01,expense,Makanan/g).length, 25);
  assert.ok(csv.includes('"a,""b""\r\nc"'));
  assert.equal(ledger.filterHistory(rows, { q: 'mAkAnAn' }, [cat], 'id').length, 25);
});
test('dirty normalization treats restore-to-baseline as clean', () => {
  const draft = { type: 'expense', amount: '100', categoryId: 'food', date: '2026-01-01', description: '' };
  assert.equal(ledger.normalizeDraft(draft), ledger.normalizeDraft({ ...draft, amount: '100.0', description: ' ' }));
  assert.notEqual(ledger.normalizeDraft(draft), ledger.normalizeDraft({ ...draft, amount: '101' }));
});
test('failed cloud delete/undo do not claim success or mutate local ledger', async () => {
  const client = { from() { return { update() { return this; }, eq() { return this; }, async select() { return { error: { code: 'network' } }; } }; } };
  const { store } = harness({ supabase: client, userId: 'A' });
  await assert.rejects(store.softDeleteTransaction('a'));
  assert.equal(store.state.transactions[0].deleted_at, null);
  store.data.transactions[0].deleted_at = '2026-01-01';
  await assert.rejects(store.undoDeleteTransaction('a'));
  assert.equal(store.state.transactions[0].deleted_at, '2026-01-01');
});
