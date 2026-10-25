import { integer, sortHistory } from './ledger.js';

export function csvText(value) {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f\u007f-\u009f]*[=+@-]/u.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
export async function makeCSV(rows, categories, lang = 'id') {
  const lookup = new Map(categories.map(c => [c.id, c]));
  const lines = ['\uFEFFdate,type,category,description,amount'];
  const sorted = sortHistory(rows.filter(t => !t.deleted_at));
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i], c = lookup.get(t.category.id) || t.category;
    const name = (lang === 'id' ? c?.nameId || c?.name : c?.name) || 'Kategori tidak tersedia';
    lines.push([t.date, t.type, csvText(name), csvText(t.description), integer(t.amount).toString()].join(','));
    if (i % 500 === 499) await new Promise(resolve => setTimeout(resolve, 0));
  }
  return `${lines.join('\r\n')}\r\n`;
}
