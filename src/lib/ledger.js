import { monthRangeISO, todayISO } from './format.js';

export const emptySettings = () => ({ openingBalanceAmount: null, openingBalanceDate: null });
export function integer(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new Error('precision');
  if (!/^-?\d+$/.test(String(value))) throw new Error('integer');
  return BigInt(value);
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [y, m, d] = value.split('-').map(Number);
  return y >= 1 && y <= 9999 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(y, m, 0).getDate();
}
export function validateSettings(settings) {
  const { openingBalanceAmount: amount, openingBalanceDate: date } = settings;
  if (amount === null && date === null) return;
  if (amount === null || !validDate(date) || integer(amount) < 0n || integer(amount) > 999999999999999n) throw new Error('settings');
}
export function migrateDemo(data) {
  if (data?.user?.uid !== 'demo-uid' || !Array.isArray(data.categories) || !Array.isArray(data.transactions)) throw new Error('demoMigrationFailed');
  if (data.schemaVersion !== undefined && ![1, 2].includes(data.schemaVersion)) throw new Error('demoMigrationFailed');
  for (const t of data.transactions) {
    if (!t.id || !t.category?.id || !validDate(t.date) || !['income', 'expense'].includes(t.type) || integer(t.amount) <= 0n) throw new Error('demoMigrationFailed');
  }
  const result = { ...data, schemaVersion: 2, financialSettings: data.schemaVersion === 2 ? data.financialSettings : emptySettings() };
  validateSettings(result.financialSettings);
  return result;
}
// Deployment recovery adapter, never invoked automatically or exposed as import UI.
export function projectDemoRollback(data) {
  const { schemaVersion, financialSettings, ...v1 } = migrateDemo(data);
  return v1;
}
export function sortHistory(rows) {
  return [...rows].sort((a, b) => b.date.localeCompare(a.date) || (b.created_at || '').localeCompare(a.created_at || '') || a.id.localeCompare(b.id));
}
export function filterHistory(rows, filters = {}, categories = [], lang = 'id') {
  const lookup = new Map(categories.map(c => [c.id, c]));
  const q = (filters.q || '').trim().toLocaleLowerCase();
  return sortHistory(rows.filter(t => {
    if (t.deleted_at || (filters.year && t.date.slice(0, 4) !== String(filters.year).padStart(4, '0'))) return false;
    if (filters.month && filters.month !== 'all' && Number(t.date.slice(5, 7)) !== Number(filters.month)) return false;
    if (filters.type && filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.category && filters.category !== 'all' && t.category.id !== filters.category) return false;
    const c = lookup.get(t.category.id) || t.category;
    return !q || `${t.description || ''}\n${lang === 'id' ? c.nameId || c.name : c.name}`.toLocaleLowerCase().includes(q);
  }));
}
export function totals(rows, start, end) {
  let income = 0n, expense = 0n;
  const byIncome = {}, byExpense = {};
  const active = rows.filter(t => !t.deleted_at && (!start || t.date >= start) && (!end || t.date < end));
  for (const t of active) {
    const amount = integer(t.amount);
    const map = t.type === 'income' ? byIncome : byExpense;
    if (t.type === 'income') income += amount; else expense += amount;
    map[t.category.id] = (map[t.category.id] || 0n) + amount;
  }
  return { rows: active, income, expense, balance: income - expense, byIncome, byExpense };
}
export function shiftedMonth(year, monthIndex, delta) {
  const serial = year * 12 + monthIndex + delta;
  return { year: Math.floor(serial / 12), monthIndex: ((serial % 12) + 12) % 12 };
}
export function insights(rows, year, monthIndex, settings = emptySettings(), today = todayISO()) {
  const range = monthRangeISO(year, monthIndex);
  const previous = shiftedMonth(year, monthIndex, -1);
  const prevRange = monthRangeISO(previous.year, previous.monthIndex);
  const selected = totals(rows, range.start, range.end);
  const prior = totals(rows, prevRange.start, prevRange.end);
  const current = today.slice(0, 7) === range.start.slice(0, 7);
  const future = range.start.slice(0, 7) > today.slice(0, 7);
  const trend = Array.from({ length: 6 }, (_, i) => {
    const period = shiftedMonth(year, monthIndex, i - 5);
    const r = monthRangeISO(period.year, period.monthIndex);
    return { ...period, ...totals(rows, r.start, r.end), future: r.start.slice(0, 7) > today.slice(0, 7) };
  });
  const configured = settings.openingBalanceAmount !== null;
  const available = !configured || settings.openingBalanceDate < range.end;
  const cumulative = available ? (configured ? integer(settings.openingBalanceAmount) : 0n) + totals(rows, configured ? settings.openingBalanceDate : null, range.end).balance : null;
  let aligned = null;
  if (current) {
    const day = Number(today.slice(-2));
    const last = new Date(previous.year, previous.monthIndex + 1, 0).getDate();
    const prevLast = `${prevRange.start.slice(0, 8)}${String(Math.min(day, last)).padStart(2, '0')}`;
    aligned = { start: range.start, end: today, previousStart: prevRange.start, previousEnd: prevLast, shorter: last < day,
      selected: totals(rows.filter(t => t.date <= today), range.start, range.end),
      previous: totals(rows.filter(t => t.date <= prevLast), prevRange.start, prevRange.end) };
  }
  return { selected, prior, previous, trend, current, future, configured, cumulative, aligned };
}
export function percent(selected, prior) {
  return prior > 0n ? `${Number((selected - prior) * 1000n / prior) / 10}%` : '';
}
export function ratio(value, max) { return max > 0n ? Number(value * 100000n / max) / 100000 : 0; }
export function normalizeDraft(draft) {
  let amount;
  try { amount = transactionAmount(draft.amount); } catch { amount = draft.amount; }
  return JSON.stringify({ ...draft, amount: String(amount), description: draft.description.trim() });
}
export function transactionAmount(value) {
  const text = String(value).replace(/[^0-9.]/g, '');
  const amount = /^\d+$/.test(text) ? BigInt(text) : BigInt(Math.round(Number(text)));
  if (amount <= 0n || amount > 9223372036854775807n) throw new Error('amount');
  return amount <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(amount) : amount.toString();
}
