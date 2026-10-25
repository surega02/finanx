import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { buildSync } from 'esbuild';

const base = 'http://127.0.0.1:5176';
const out = path.resolve('.impeccable/review');
fs.mkdirSync(out, { recursive: true });
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', '.impeccable/review/demo-dist'], { env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' }, windowsHide: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', '.impeccable/review/demo-dist', '--host', '127.0.0.1', '--port', '5176', '--strictPort'], {
  env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
let browser;
const errors = [];
const results = [];
const check = (name, value) => { assert.ok(value, name); results.push(name); console.log(`PASS ${name}`); };
const fill = async (page, selector, value) => page.$eval(selector, (el, value) => {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
}, value);
const textClick = async (page, selector, text) => {
  const clicked = await page.$$eval(selector, (els, text) => {
    const el = els.find(el => el.textContent.trim() === text && el.getClientRects().length);
    if (el) el.click(); return !!el;
  }, text);
  assert.ok(clicked, `button ${text}`);
};
const login = async page => { await page.waitForSelector('.login__google'); await page.click('.login__google'); await page.waitForSelector('.surface'); };
const render = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const capture = async (page, name) => {
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 350));
  await page.screenshot({ path: path.join(out, name), fullPage: true });
};
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Vite timeout')), 15000);
    server.stdout.on('data', data => { if (data.toString().includes('Local:')) { clearTimeout(timer); resolve(); } });
    server.once('exit', code => { if (code) reject(new Error(`Vite ${code}`)); });
  });
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  for (const width of [1440, 360]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.on('pageerror', e => { errors.push(e.message); console.error('BROWSER ERROR', e.stack); });
    await page.setViewport({ width, height: 900, isMobile: width === 360, hasTouch: width === 360 });
    if (width === 360) await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
    await page.goto(`${base}/?view=dashboard&year=2025&month=12`); await login(page);
    await page.waitForSelector('.trend');
    check(`${width} six exact trend values`, await page.$$eval('.trend-values > div', els => els.length === 6));
    check(`${width} monthly summary three cells`, await page.$$eval('.summary__cell', els => els.length === 3));
    check(`${width} dashboard no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await capture(page, `v2-${width}.png`);
    await textClick(page, '.summary .ledger-link', 'Lihat transaksi'); await page.waitForSelector('.filters');
    check(`${width} drill-down period/type`, await page.evaluate(() => { const p = new URLSearchParams(location.search); return p.get('year') === '2025' && p.get('month') === '12' && p.get('type') === 'income'; }));
    await page.goBack(); await page.waitForSelector('.trend');
    check(`${width} Back restores dashboard`, await page.evaluate(() => location.search.includes('year=2025') && location.search.includes('month=12')));
    await page.click('.fab'); await page.waitForSelector('#tx-amount');
    await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
    check(`${width} initial Shift+Tab stays inside dialog`, await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')));
    await fill(page, '#tx-amount', '12345');
    await textClick(page, '.sheet button', 'Gunakan Riwayat'); await page.waitForSelector('.history-choice');
    check(`${width} picker starts with ten`, await page.$$eval('.history-choice', els => els.length === 10));
    await capture(page, `picker-${width}.png`);
    await page.goBack(); await page.waitForSelector('#tx-amount');
    check(`${width} picker Back retains draft`, await page.$eval('#tx-amount', el => el.value === '12345'));
    await page.keyboard.press('Escape'); await textClick(page, '.sheet button', 'Kembali Mengedit');
    check(`${width} dirty cancel retains draft`, await page.$eval('#tx-amount', el => el.value === '12345'));
    await page.keyboard.press('Escape'); await textClick(page, '.sheet button', 'Buang Perubahan'); await page.waitForSelector('.sheet', { hidden: true });
    const nav = width === 360 ? '.tabbar__item' : '.nav__item';
    await textClick(page, nav, 'Transaksi'); await page.waitForSelector('.txlist__row');
    await textClick(page, '.txlist__actions button', 'Catat Lagi'); await page.waitForSelector('#tx-amount');
    const original = await page.$eval('#tx-amount', el => el.value);
    check(`${width} reuse prefilled`, Number(original) > 0);
    await capture(page, `entry-${width}.png`);
    await page.keyboard.press('Escape'); await page.waitForSelector('.sheet', { hidden: true });
    await textClick(page, '.txlist__actions button', 'Catat Lagi'); await page.waitForSelector('#tx-amount');
    await fill(page, '#tx-desc', 'V2 browser acceptance');
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('finanx:demo:v2')).transactions.length);
    await textClick(page, '.sheet button', 'Catat'); await page.waitForSelector('.sheet', { hidden: true });
    check(`${width} reuse creates exactly one new transaction`, await page.evaluate(before => JSON.parse(localStorage.getItem('finanx:demo:v2')).transactions.length === before + 1, before));
    await fill(page, '.search input', 'V2 browser acceptance'); await render(page);
    check(`${width} search resets pagination and finds saved row`, await page.$$eval('.txlist__row', els => els.length === 1));
    await page.click('.txlist__actions [aria-label="Ubah"]'); await page.waitForSelector('#tx-amount');
    await fill(page, '#tx-amount', '54321'); await fill(page, '#tx-date', '2027-01-05');
    await textClick(page, '.sheet button', 'Simpan perubahan'); await page.waitForSelector('.sheet', { hidden: true });
    check(`${width} future edit leaves old period`, await page.$$eval('.txlist__row', els => els.length === 0));
    await fill(page, '[aria-label="Tahun"]', '2027'); await page.$eval('[aria-label="Tahun"]', el => el.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
    await page.select('[aria-label="Bulan"]', '0'); await page.waitForSelector('.txlist__row');
    await page.click('.txlist__actions [aria-label="Hapus"]'); await render(page);
    check(`${width} V1 delete updates filtered list`, await page.$$eval('.txlist__row', els => els.length === 0));
    await textClick(page, '.toast button', 'Urungkan'); await page.waitForSelector('.txlist__row');
    check(`${width} V1 undo restores edited amount`, await page.$eval('.txlist__amount', el => el.textContent.includes('54.321')));
    await capture(page, `transactions-${width}.png`);
    await textClick(page, nav, 'Transaksi'); await page.waitForSelector('.txlist__row');
    await textClick(page, '.period-controls button', 'Ekspor Data'); await page.waitForSelector('#export-title');
    await capture(page, `export-${width}.png`);
    const downloads = path.join(out, `downloads-${width}`); fs.mkdirSync(downloads, { recursive: true });
    const cdp = await page.createCDPSession(); await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
    await textClick(page, '.sheet button', 'Unduh CSV');
    await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('browser'));
    await page.waitForFunction(() => !document.querySelector('.sheet button:disabled'));
    await new Promise(r => setTimeout(r, 300));
    const files = fs.readdirSync(downloads).filter(f => f.endsWith('.csv'));
    check(`${width} CSV download complete`, files.length > 0);
    const csv = fs.readFileSync(path.join(downloads, files.at(-1)), 'utf8');
    check(`${width} CSV includes >10 rows and BOM`, csv.charCodeAt(0) === 0xfeff && csv.split('\r\n').length > 12);
    await page.keyboard.press('Escape'); await page.waitForSelector('.sheet', { hidden: true });
    await textClick(page, nav, 'Kategori'); await textClick(page, '.section-head button', 'Tambah kategori'); await page.waitForSelector('#cat-name');
    await fill(page, '#cat-name', 'V2 regression custom'); await textClick(page, '.sheet button', 'Simpan'); await page.waitForSelector('.sheet', { hidden: true });
    check(`${width} V1 custom category creation`, await page.$$eval('.catmanage__name', els => els.some(el => el.textContent.includes('V2 regression custom'))));
    page.once('dialog', dialog => dialog.accept()); await page.click('[aria-label="Hapus: V2 regression custom"]');
    await render(page);
    check(`${width} V1 custom category soft deletion`, await page.evaluate(() => JSON.parse(localStorage.getItem('finanx:demo:v2')).categories.some(c => c.name === 'V2 regression custom' && c.deleted_at)));
    await textClick(page, nav, 'Profil'); await page.waitForSelector('[aria-label="Nominal saldo awal (IDR)"]');
    await fill(page, '[aria-label="Nominal saldo awal (IDR)"]', '0'); await fill(page, '[aria-label="Tanggal mulai"]', '2027-01-15');
    await textClick(page, '.plate button', 'Simpan saldo awal'); await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('tersimpan'));
    check(`${width} explicit zero and future opening saved`, await page.evaluate(() => JSON.parse(localStorage.getItem('finanx:demo:v2')).financialSettings.openingBalanceAmount === '0'));
    await textClick(page, '.plate button', 'Reset saldo awal'); await textClick(page, '.plate button', 'Batal');
    check(`${width} reset cancel preserves settings`, await page.evaluate(() => JSON.parse(localStorage.getItem('finanx:demo:v2')).financialSettings.openingBalanceAmount === '0'));
    await capture(page, `settings-${width}.png`);
    await textClick(page, '.lang-pick__btn', 'English');
    check(`${width} new controls localized`, await page.$$eval('h2', els => els.some(el => el.textContent.includes('Financial Settings'))));
    check(`${width} profile no overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await textClick(page, '.lang-pick__btn', 'Bahasa Indonesia');
    await textClick(page, nav, 'Ringkasan'); await page.waitForSelector('.trend');
    await capture(page, `v2-populated-${width}.png`);
    await context.close();
  }

  const benchmarks = [];
  for (const mobile of [false, true]) {
    const page = await browser.newPage();
    await page.setViewport({ width: mobile ? 360 : 1440, height: 900, isMobile: mobile, hasTouch: mobile });
    const cdp = await page.createCDPSession();
    if (mobile) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(base); await login(page);
    const benchmarkCode = buildSync({ stdin: { contents: "import * as ledger from './src/lib/ledger.js'; import { makeCSV } from './src/lib/csv.js'; window.ledgerBenchmark = { ...ledger, makeCSV };", resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife' }).outputFiles[0].text;
    await page.addScriptTag({ content: benchmarkCode });
    const result = await page.evaluate(async () => {
      const { insights, filterHistory, normalizeDraft, makeCSV } = window.ledgerBenchmark;
      const categories = Array.from({ length: 100 }, (_, i) => ({ id: `c${i}`, type: i % 2 ? 'income' : 'expense', name: `Category ${i}`, nameId: `Kategori ${i}`, icon: 'wallet', source: 'user', deleted_at: i % 10 ? null : '2026-01-01' }));
      const rows = Array.from({ length: 10000 }, (_, i) => {
        const month = Math.floor(i / 167) % 60;
        return { id: `b${i}`, type: categories[i % 100].type, category: categories[i % 100], amount: 10000 + i, date: `${2023 + Math.floor(month / 12)}-${String(month % 12 + 1).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')}`, description: `Long description ${'ledger '.repeat(35)} ${i}`, created_at: new Date(2026, 0, 1, 0, 0, i).toISOString(), deleted_at: null };
      });
      const measure = fn => { const times = []; for (let i = 0; i < 40; i++) { const start = performance.now(); fn(i); times.push(performance.now() - start); } return times.sort((a, b) => a - b)[Math.ceil(times.length * .95) - 1]; };
      const dashboard = measure(i => insights(rows, 2026, i % 12));
      const history = measure(i => filterHistory(rows, { year: 2023 + i % 5, month: 'all', q: String(i) }, categories));
      const picker = measure(i => filterHistory(rows, { q: String(i) }, categories).slice(0, 10).map(t => normalizeDraft({ type: t.type, amount: t.amount, description: t.description, date: t.date, categoryId: t.category.id })));
      const heapBefore = performance.memory?.usedJSHeapSize;
      let ticks = 0; const timer = setInterval(() => ticks++, 1);
      const start = performance.now(); const csv = await makeCSV(rows, categories); const csvMs = performance.now() - start; clearInterval(timer);
      const heapAfter = performance.memory?.usedJSHeapSize;
      const fixture = JSON.stringify({ schemaVersion: 2, user: { uid: 'demo-uid', name: 'Benchmark', created_at: '2023-01-01', updated_at: '2026-01-01' }, language: 'id', categories, transactions: rows, financialSettings: { openingBalanceAmount: null, openingBalanceDate: null } });
      return { fixture, dashboardP95: dashboard, historyP95: history, pickerP95: picker, csvMs, heapBefore, heapAfter, bytes: new Blob([csv]).size, eventLoopTicks: ticks, activeRows: rows.length, categories: categories.length, years: 5, networkFetch: 'not applicable: benchmark data supplied in memory' };
    });
    // This benchmark explicitly measures data resident in memory, independently of
    // localStorage's browser quota. No production persistence limit is bypassed.
    await page.evaluateOnNewDocument(fixture => {
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = function(key) { return key === 'finanx:demo:v2' ? fixture : original.call(this, key); };
    }, result.fixture);
    delete result.fixture;
    await page.reload(); await login(page);
    const renderTimes = [];
    for (let i = 0; i < 20; i++) {
      renderTimes.push(await page.evaluate(async () => { const start = performance.now(); document.querySelector('.monthnav__btn[aria-label="Sebelumnya"]').click(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - start; }));
    }
    result.dashboardRenderP95 = renderTimes.sort((a, b) => a - b)[18];
    await textClick(page, mobile ? '.tabbar__item' : '.nav__item', 'Transaksi'); await page.waitForSelector('.filters');
    const historyRenders = [];
    for (let i = 0; i < 20; i++) historyRenders.push(await page.evaluate(async i => {
      const start = performance.now(), input = document.querySelector('.search input');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(i));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - start;
    }, i));
    result.historyRenderP95 = historyRenders.sort((a, b) => a - b)[18];
    const opens = [], prefills = [];
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => document.querySelector('.fab').click()); await page.waitForSelector('#tx-amount');
      const times = await page.evaluate(async () => {
        const paint = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        let start = performance.now(); [...document.querySelectorAll('.sheet button')].find(b => b.textContent === 'Gunakan Riwayat').click(); await paint();
        const open = performance.now() - start; start = performance.now(); document.querySelector('.history-choice').click(); await paint();
        return { open, prefill: performance.now() - start };
      });
      opens.push(times.open); prefills.push(times.prefill);
      await page.keyboard.press('Escape'); await textClick(page, '.sheet button', 'Buang Perubahan'); await page.waitForSelector('.sheet', { hidden: true });
    }
    result.pickerOpenP95 = opens.sort((a, b) => a - b)[18]; result.prefillP95 = prefills.sort((a, b) => a - b)[18];
    result.context = mobile ? 'desktop Chrome, mobile viewport, CPU 4x (proxy only; NOT physical Android)' : 'desktop Chrome';
    console.log(JSON.stringify(result));
    benchmarks.push(result);
    fs.writeFileSync(path.join(out, 'v2-browser-results.json'), JSON.stringify({ checks: results, errors, benchmarks }, null, 2));
    check(`${result.context} computation performance targets`, result.dashboardP95 <= 500 && result.historyP95 <= 500 && result.pickerP95 <= 300);
    check(`${result.context} Dashboard render <=500ms`, result.dashboardRenderP95 <= 500);
    check(`${result.context} history render <=500ms`, result.historyRenderP95 <= 500);
    check(`${result.context} picker and prefill render <=300ms`, result.pickerOpenP95 <= 300 && result.prefillP95 <= 300);
    check(`${result.context} CSV yields event loop`, result.eventLoopTicks > 0);
    await page.close();
  }
  check('no uncaught browser errors', errors.length === 0);
  fs.writeFileSync(path.join(out, 'v2-browser-results.json'), JSON.stringify({ checks: results, errors, benchmarks }, null, 2));
  console.log(JSON.stringify(benchmarks, null, 2));
} finally { if (browser) await browser.close(); server.kill(); }
