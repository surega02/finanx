import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('.impeccable/review');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

async function shot(page, name) {
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 600));
  const vp = page.viewport();
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`captured ${name} (${vp.width}x${vp.height}) -> ${file}`);
}

async function clickByText(page, text, tag = 'button') {
  const ok = await page.evaluate(([t, tg]) => {
    const nodes = [...document.querySelectorAll(`${tg}`)];
    const el = nodes.find((n) => n.textContent.trim().replace(/\s+/g, ' ') === t);
    if (el) { el.click(); return true; }
    return false;
  }, [text, tag]);
  if (!ok) throw new Error(`could not click ${tag} with text "${text}"`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'],
});

for (const [kind, vp] of Object.entries(VIEWPORTS)) {
  const page = await browser.newPage();
  await page.setViewport(vp);

  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await shot(page, `login-${kind}`);

  await page.click('.login__google');
  await page.waitForSelector('.surface', { timeout: 10000 });
  await shot(page, `dashboard-${kind}`);

  await page.click('.fab');
  await page.waitForSelector('.sheet', { timeout: 5000 });
  await shot(page, `sheet-${kind}`);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.sheet', { hidden: true, timeout: 5000 });

  await clickByText(page, 'Transaksi');
  await sleep(500);
  await shot(page, `transactions-${kind}`);

  await clickByText(page, 'Kategori');
  await sleep(500);
  await shot(page, `categories-${kind}`);

  await clickByText(page, 'Profil');
  await sleep(500);
  await shot(page, `profile-${kind}`);

  await page.close();
}

await browser.close();
console.log('done');
