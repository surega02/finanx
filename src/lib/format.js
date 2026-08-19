export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtIDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const fmtNumber = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

export function money(value, { compact = false } = {}) {
  if (compact) {
    const v = Math.round(value);
    if (v >= 1_000_000_000) return `Rp${(v / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
    if (v >= 1_000_000) return `Rp${(v / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
    if (v >= 1_000) return `Rp${(v / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
  }
  return fmtIDR.format(value);
}

export function number(value) {
  return fmtNumber.format(value);
}

export function monthName(monthIndex, lang) {
  return lang === 'id' ? MONTHS_ID[monthIndex] : MONTHS_EN[monthIndex];
}

export function monthLabel(year, monthIndex, lang) {
  return `${monthName(monthIndex, lang)} ${year}`;
}

export function shortDate(iso, lang) {
  const d = new Date(`${iso}T00:00:00`);
  const m = d.getMonth();
  const day = d.getDate();
  return lang === 'id' ? `${day} ${SHORT_ID[m]} ${d.getFullYear()}` : `${SHORT_EN[m]} ${day}, ${d.getFullYear()}`;
}

export function shortDateNoYear(iso, lang) {
  const d = new Date(`${iso}T00:00:00`);
  const m = d.getMonth();
  const day = d.getDate();
  return lang === 'id' ? `${day} ${SHORT_ID[m]}` : `${SHORT_EN[m]} ${day}`;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthRangeISO(year, monthIndex) {
  const start = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
  const end = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`;
  return { start, end };
}

export function niceMax(a, b) {
  const m = Math.max(a, b, 1);
  const mag = 10 ** Math.floor(Math.log10(m));
  const norm = m / mag;
  let step;
  if (norm <= 1) step = 1;
  else if (norm <= 2) step = 2;
  else if (norm <= 5) step = 5;
  else step = 10;
  const top = step * mag;
  if (top === m) return top;
  return top > m * 2 ? step * mag * 0.5 : top;
}