const VIEWS = ['dashboard', 'transactions', 'categories', 'profile'];
export function safeReturn(value) {
  if (typeof value !== 'string' || !value.startsWith('/?') || /[\\\r\n]/.test(value)) return null;
  try {
    const u = new URL(value, 'https://finanx.invalid');
    if (u.origin !== 'https://finanx.invalid' || u.pathname !== '/' || u.searchParams.get('view') !== 'dashboard' || u.hash) return null;
    const p = parseNavigation(u.search);
    return routeURL('dashboard', { year: p.year, month: p.month });
  } catch { return null; }
}
export function parseNavigation(search, categories) {
  const p = new URLSearchParams(search);
  const now = new Date();
  const year = /^\d{1,4}$/.test(p.get('year') || '') && +p.get('year') >= 1 && +p.get('year') <= 9999 ? +p.get('year') : now.getFullYear();
  const rawMonth = p.get('month');
  const view = VIEWS.includes(p.get('view')) ? p.get('view') : 'dashboard';
  const month = rawMonth === 'all' && view === 'transactions' ? 'all' : /^(?:[1-9]|1[0-2])$/.test(rawMonth || '') ? +rawMonth : now.getMonth() + 1;
  const category = p.get('category');
  return { view, year, month, type: ['income', 'expense'].includes(p.get('type')) ? p.get('type') : 'all',
    category: category && (!categories || categories.some(c => c.id === category)) ? category : 'all',
    q: (p.get('q') || '').slice(0, 2000), page: /^[1-9]\d{0,5}$/.test(p.get('page') || '') ? +p.get('page') : 1,
    return: p.get('return') };
}
export function routeURL(view, state = {}) {
  const p = new URLSearchParams({ view });
  for (const [key, value] of Object.entries(state)) {
    if (value !== undefined && value !== null && value !== '' && (value !== 'all' || key === 'month')) p.set(key, String(value));
  }
  return `/?${p}`;
}
