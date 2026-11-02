import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const out = path.resolve('.impeccable/review');
fs.mkdirSync(out, { recursive: true });
const base = 'http://127.0.0.1:5179';
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', '.impeccable/review/period-dist'], { env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' }, windowsHide: true, stdio: 'ignore' });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', '.impeccable/review/period-dist', '--host', '127.0.0.1', '--port', '5179', '--strictPort'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
const food = { id: 'food', name: 'Food', nameId: 'Makanan', type: 'expense', icon: 'utensils', source: 'user' };
const income = { id: 'salary', name: 'Salary', nameId: 'Gaji', type: 'income', icon: 'wallet', source: 'user' };
const archived = { ...food, id: 'archived', name: 'Archived', nameId: 'Arsip', deleted_at: '2026-01-01' };
const row = (id, date, extra = {}) => ({ id, date, category: food, amount: '25000', type: 'expense', description: id, created_at: `${date}T08:00:00Z`, deleted_at: null, ...extra });
const fixture = { schemaVersion: 2, user: { uid: 'demo-uid', name: 'Synthetic date fixture', email: 'fixture@example.test', created_at: '2025-01-01T00:00:00Z', updated_at: '2026-01-03T00:00:00Z' }, language: 'id', categories: [food, income, archived], financialSettings: { openingBalanceAmount: null, openingBalanceDate: null }, transactions: [
  row('outside', '2025-12-27'), row('week boundary', '2025-12-28'), row('old category', '2025-12-29', { category: archived }), row('yesterday', '2026-01-02'),
  ...Array.from({ length: 15 }, (_, i) => row(`Rent ${String(i).padStart(2, '0')}`, '2026-01-03')),
  row('Salary today', '2026-01-03', { type: 'income', category: income }), row('future', '2026-01-04'), row('deleted', '2026-01-03', { deleted_at: '2026-01-03' }),
] };
const checks = [], errors = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); console.log('PASS', name); };
const paint = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const clickText = async (page, selector, text) => assert.ok(await page.$$eval(selector, (els, text) => { const el = els.find(el => el.textContent.trim() === text && el.getClientRects().length); el?.click(); return !!el; }, text), text);
const fill = (page, selector, value) => page.$eval(selector, (el, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
const login = async page => { await page.waitForSelector('.login__google'); await page.click('.login__google'); await page.waitForSelector('.history-period'); };
const quick = async (page, text) => { await clickText(page, '.history-period button', text); await paint(page); };
const count = (page, expected) => page.evaluate(expected => { const meta = document.querySelector('.pagination__meta'); return meta ? meta.textContent.includes(`· ${expected} transaksi`) : document.querySelectorAll('.txlist__row').length === expected; }, expected);
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('preview timeout')), 15000);
    server.stdout.on('data', data => { if (data.toString().includes('Local:')) { clearTimeout(timer); resolve(); } });
    server.once('exit', code => reject(new Error(`preview exit ${code}`)));
  });
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  for (const width of [1440, 360, 320]) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width, height: 900, isMobile: width <= 360, hasTouch: width <= 360 });
    await page.emulateTimezone('Asia/Jakarta');
    await page.evaluateOnNewDocument(fixture => {
      const RealDate = Date;
      window.__periodClock = RealDate.parse('2026-01-03T00:30:00+07:00');
      window.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [window.__periodClock])); } static now() { return window.__periodClock; } };
      localStorage.setItem('finanx:demo:v2', JSON.stringify(fixture));
    }, fixture);
    await page.goto(`${base}/?view=transactions&year=2025&month=12`); await login(page);
    check(`${width} existing manual calendar remains default`, await count(page, 3) && await page.$('[aria-label="Tahun"]') !== null);
    await quick(page, 'Hari Ini');
    check(`${width} today uses local date rather than UTC date`, await count(page, 16));
    check(`${width} manual month does not constrain quick period`, await page.$('[aria-label="Tahun"]') === null && await page.$eval('.history-period__summary', el => el.textContent.includes('3 Jan 2026')));
    await clickText(page, '.pagination button', 'Berikutnya'); await paint(page);
    check(`${width} today pagination includes remaining six rows`, await page.$$eval('.txlist__row', els => els.length === 6));
    await quick(page, '7 Hari');
    check(`${width} seven days crosses year and resets page`, await count(page, 19) && new URL(page.url()).searchParams.get('page') === '1');
    check(`${width} exact inclusive dates are visible`, await page.$eval('.history-period__summary', el => el.textContent.includes('28 Des 2025') && el.textContent.includes('3 Jan 2026')));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, `history-period-week-${width}.png`) });
    check(`${width} all quick buttons meet touch target and fit page`, await page.$$eval('.history-period button', els => els.every(el => { const r = el.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth; })) && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.reload(); await login(page);
    check(`${width} refresh restores selected range`, await count(page, 19) && await page.$eval('.history-period [aria-pressed="true"]', el => el.textContent === '7 Hari'));
    const nav = width <= 360 ? '.tabbar__item' : '.nav__item';
    await clickText(page, nav, 'Ringkasan'); await page.waitForSelector('.trend');
    await page.goBack(); await page.waitForSelector('.history-period');
    check(`${width} browser Back restores range`, await count(page, 19));
    await page.select('[aria-label="Kategori"]', 'archived'); await paint(page);
    check(`${width} quick range retains historic category filtering`, await count(page, 1));
    await page.select('[aria-label="Kategori"]', 'all');
    await clickText(page, '.filters .seg button', 'Pemasukan'); await paint(page);
    check(`${width} quick range combines income filter`, await count(page, 1));
    await clickText(page, '.filters .seg button', 'Semua');
    await fill(page, '.search input', 'Rent 03'); await paint(page);
    check(`${width} quick range combines search`, await count(page, 1));
    await fill(page, '.search input', '');
    await quick(page, '1 Bulan');
    check(`${width} one month means first through today and excludes future`, await count(page, 17) && await page.$eval('.history-period__summary', el => el.textContent.includes('1 Jan 2026')));
    await page.screenshot({ path: path.join(out, `history-period-month-${width}.png`) });
    await quick(page, 'Bulan/Tahun');
    check(`${width} returning to manual calendar restores prior period`, await count(page, 3) && await page.$eval('[aria-label="Tahun"]', el => el.value === '2025'));
    await page.$eval('.history-period button', el => el.focus()); await page.keyboard.press('Space'); await paint(page);
    check(`${width} quick filter supports keyboard`, await count(page, 16));
    await clickText(page, '.period-controls button', 'Ekspor Data'); await page.waitForSelector('#export-title');
    check(`${width} export shows active quick dates`, await page.$eval('.sheet__body', el => el.textContent.includes('3 Jan 2026')));
    const directory = path.join(out, `period-downloads-${width}`); fs.mkdirSync(directory, { recursive: true });
    for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.csv'))) fs.unlinkSync(path.join(directory, file));
    const cdp = await page.createCDPSession(); await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: directory });
    await clickText(page, '.sheet button', 'Unduh CSV'); await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('browser'));
    let file;
    for (let i = 0; i < 30 && !file; i++) { file = fs.readdirSync(directory).find(file => file.endsWith('.csv')); if (!file) await new Promise(resolve => setTimeout(resolve, 100)); }
    assert.ok(file, 'CSV download completed');
    const csv = fs.readFileSync(path.join(directory, file), 'utf8');
    check(`${width} filtered CSV contains all 16 matching rows across pages`, csv.split('\r\n').filter(line => line.startsWith('2026-01-03,')).length === 16 && !csv.includes('2026-01-04') && !csv.includes('2026-01-02') && !csv.includes('deleted'));
    await page.keyboard.press('Escape'); await page.waitForSelector('.sheet', { hidden: true });
    await page.evaluate(() => { window.__periodClock = Date.parse('2026-01-04T00:01:00+07:00'); window.dispatchEvent(new Event('focus')); }); await paint(page);
    check(`${width} local day updates after midnight and resume`, await count(page, 1) && await page.$eval('.txlist__desc', el => el.textContent === 'future'));
    await clickText(page, nav, 'Profil'); await page.waitForSelector('.lang-pick__btn');
    await clickText(page, '.lang-pick__btn', 'English');
    await clickText(page, nav, 'Transactions'); await page.waitForSelector('.history-period');
    check(`${width} quick controls localized in English`, await page.$$eval('.history-period button', els => els.map(el => el.textContent).join('|') === 'Today|7 Days|1 Month|Month/Year'));
    await context.close();
  }
  check('no uncaught browser errors', errors.length === 0);
  fs.writeFileSync(path.join(out, 'history-period-results.json'), JSON.stringify({ checks, errors, scope: 'Synthetic demo; desktop Chrome and mobile viewport emulation; fixed local time in Asia/Jakarta; not physical Android or Production' }, null, 2));
} finally { if (browser) await browser.close(); server.kill(); }
