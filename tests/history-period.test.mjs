import assert from 'node:assert/strict';
import test from 'node:test';
import { historyPeriod } from '../src/lib/history-period.js';
import { filterHistory } from '../src/lib/ledger.js';
import { parseNavigation, routeURL } from '../src/lib/navigation.js';
import { makeCSV } from '../src/lib/csv.js';

const category = { id: 'food', name: 'Food', nameId: 'Makanan', source: 'user' };
const row = (id, date, extra = {}) => ({ id, date, type: 'expense', amount: '100', description: 'Lunch', category, deleted_at: null, ...extra });

test('quick periods include today, cross year/month boundaries and cap current month at today', () => {
  assert.deepEqual(historyPeriod('today', '2026-01-03'), { startDate: '2026-01-03', endDate: '2026-01-03' });
  assert.deepEqual(historyPeriod('7d', '2026-01-03'), { startDate: '2025-12-28', endDate: '2026-01-03' });
  assert.deepEqual(historyPeriod('7d', '2026-03-01'), { startDate: '2026-02-23', endDate: '2026-03-01' });
  assert.deepEqual(historyPeriod('7d', '2024-03-01'), { startDate: '2024-02-24', endDate: '2024-03-01' });
  assert.deepEqual(historyPeriod('month', '2024-02-29'), { startDate: '2024-02-01', endDate: '2024-02-29' });
  assert.deepEqual(historyPeriod('month', '2026-11-02'), { startDate: '2026-11-01', endDate: '2026-11-02' });
  assert.equal(historyPeriod('calendar', '2026-11-02'), null);
  assert.equal(historyPeriod('invalid', '2026-11-02'), null);
});

test('seven-day history includes both bounds and excludes future/deleted/outside records', () => {
  const rows = [row('before', '2025-12-27'), row('start', '2025-12-28'), row('today', '2026-01-03'), row('future', '2026-01-04'), row('deleted', '2026-01-02', { deleted_at: '2026-01-03' })];
  assert.deepEqual(filterHistory(rows, historyPeriod('7d', '2026-01-03')).map(r => r.id), ['today', 'start']);
  assert.deepEqual(filterHistory(rows, historyPeriod('today', '2026-01-03')).map(r => r.id), ['today']);
});

test('quick dates compose with type, historic category and description search', () => {
  const rows = [row('match', '2026-11-01'), row('other-type', '2026-11-02', { type: 'income' }), row('other-description', '2026-11-02', { description: 'Coffee' }), row('old', '2026-10-31'), row('future', '2026-11-03')];
  const filters = { ...historyPeriod('month', '2026-11-02'), type: 'expense', category: 'food', q: 'LUNCH' };
  assert.deepEqual(filterHistory(rows, filters, [{ ...category, deleted_at: 'x' }]).map(r => r.id), ['match']);
  assert.deepEqual(filterHistory(rows, { year: 2026, month: 10 }).map(r => r.id), ['old'], 'manual calendar filtering is unchanged');
});

test('range URL round trip rejects unknown values and keeps dashboard ranges out', () => {
  for (const range of ['today', '7d', 'month']) {
    const state = parseNavigation(new URL(routeURL('transactions', { year: 2025, month: 12, range, type: 'expense', q: 'Lunch', page: 2 }), 'https://finanx.test').search);
    assert.equal(state.range, range);
    assert.equal(state.year, 2025);
    assert.equal(state.page, 2);
    assert.equal(state.q, 'Lunch');
  }
  assert.equal(parseNavigation('?view=transactions&range=30d').range, 'calendar');
  assert.equal(parseNavigation('?view=dashboard&range=today').range, 'calendar');
  assert.equal(routeURL('transactions', { range: 'calendar' }), '/?view=transactions');
  assert.equal(routeURL('dashboard', { range: '7d' }), '/?view=dashboard');
});

test('filtered CSV uses the full inclusive date range across pages', async () => {
  const rows = Array.from({ length: 15 }, (_, i) => row(`inside-${i}`, '2026-11-01'));
  rows.push(row('old', '2026-10-31'), row('future', '2026-11-03'));
  const selected = filterHistory(rows, historyPeriod('month', '2026-11-02'));
  const csv = await makeCSV(selected, [category]);
  assert.equal(selected.length, 15);
  assert.equal(csv.split('\r\n').filter(line => line.startsWith('2026-11-01,')).length, 15);
  assert.equal(csv.includes('2026-10-31'), false);
  assert.equal(csv.includes('2026-11-03'), false);
});
