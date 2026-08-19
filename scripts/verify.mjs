import puppeteer from 'puppeteer-core';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox'] });

const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`);
};

for (const [kind, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: kind === 'mobile', hasTouch: kind === 'mobile' });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.click('.login__google');
  await page.waitForSelector('.surface', { timeout: 10000 });
  await sleep(500);

  // horizontal overflow on the document
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`${kind} no horizontal overflow`, overflow <= 0, `scrollW=${overflow}px`);

  // check nav / topbar / fab visibility
const fab = await page.evaluate(() => {
    const el = document.querySelector('.fab');
    const pad = document.querySelector('.fab__pad');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const p = pad ? pad.getBoundingClientRect() : null;
    const s = getComputedStyle(el);
    return { x: r.x, y: r.y, w: r.width, h: r.height, padW: p ? Math.round(p.width) : 0, padH: p ? Math.round(p.height) : 0, visible: s.display !== 'none' && s.visibility !== 'hidden' };
  });
  check(`${kind} fab visible`, !!fab && fab.visible, JSON.stringify(fab));
  if (kind === 'desktop') {
    check(`${kind} fab compact size`, !!fab && fab.visible && fab.padW <= 60 && fab.padH <= 60, `pad=${fab?.padW}x${fab?.padH}`);
  }

  // side nav visible on desktop, tab bar visible on mobile, sidebar hidden on mobile
  if (kind === 'desktop') {
    const side = await page.evaluate(() => {
      const el = document.querySelector('.sidebar');
      if (!el) return false;
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden';
    });
    check(`${kind} sidebar visible`, side);
  } else {
    const tabbar = await page.evaluate(() => !!document.querySelector('.tabbar'));
    check(`${kind} tabbar present`, tabbar);
    const sideVisible = await page.evaluate(() => {
      const el = document.querySelector('.sidebar');
      if (!el) return false;
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden';
    });
    check(`${kind} sidebar hidden`, !sideVisible);
  }

// summary plate colors
  const ink = await page.evaluate(() => {
    const income = document.querySelector('.summary__value--income');
    const expense = document.querySelector('.summary__value--expense');
    return {
      income: income ? getComputedStyle(income).color : null,
      expense: expense ? getComputedStyle(expense).color : null,
    };
  });
  check(`${kind} income is ink (#191918)`, !!ink.income && ink.income === 'rgb(25, 25, 24)', JSON.stringify(ink));
  check(`${kind} expense is slate (#4a5b6b)`, !!ink.expense && ink.expense === 'rgb(74, 91, 107)', JSON.stringify(ink));

  const tickAlign = await page.evaluate(() => {
    const track = document.querySelector('.cf__track');
    const nums = [...document.querySelectorAll('.cf__ticks .num')];
    if (!track || nums.length !== 3) return { ok: false };
    const t = track.getBoundingClientRect();
    const centers = nums.map((el) => {
      const r = el.getBoundingClientRect();
      return r.x + r.width / 2;
    });
    const want = [t.x, t.x + t.width / 2, t.x + t.width];
    const err = centers.map((c, i) => Math.round(Math.abs(c - want[i])));
    return { ok: err.every((e) => e <= 3), err, centers: centers.map(Math.round), want: want.map(Math.round) };
  });
  check(`${kind} ticks aligned 0/50/100`, tickAlign.ok, JSON.stringify(tickAlign));

  // open sheet, verify element layout
  await page.evaluate(() => document.querySelector('.fab').click());
  await sleep(600);
  const sheetInfo = await page.evaluate(() => {
    const el = document.querySelector('.sheet');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height, x: r.x };
  });
  check(`${kind} sheet present`, !!sheetInfo, JSON.stringify(sheetInfo));
  await page.keyboard.press('Escape');
  await sleep(400);

  // transactions page
  await page.evaluate(() => { const el = [...document.querySelectorAll('nav a, .nav__item')].find((n) => n.textContent.includes('Transaksi')); el && el.click(); });
  await sleep(400);
  const txWidth = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.txlist__row')];
    return { rows: els.length, scrollW: document.documentElement.scrollWidth };
  });
  check(`${kind} transaction rows rendered`, txWidth.rows > 0, `rows=${txWidth.rows}`);
  check(`${kind} transactions no overflow`, txWidth.scrollW <= 1441, `scrollW=${txWidth.scrollW}`);

  // categories page
  await page.evaluate(() => { const el = [...document.querySelectorAll('nav a, .nav__item')].find((n) => n.textContent.includes('Kategori')); el && el.click(); });
  await sleep(400);
  const catInfo = await page.evaluate(() => ({
    groups: document.querySelectorAll('.catmanage__group').length,
    rows: document.querySelectorAll('.catmanage__row').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  check(`${kind} category groups`, catInfo.groups === 2, `groups=${catInfo.groups}`);
  check(`${kind} category rows`, catInfo.rows > 0, `rows=${catInfo.rows}`);
  check(`${kind} categories no overflow`, catInfo.overflow <= 0, `scrollW=${catInfo.overflow}`);
  const catFab = await page.evaluate(() => !!document.querySelector('.fab'));
  check(`${kind} fab hidden on categories`, !catFab);

  // profile page
  await page.evaluate(() => { const el = [...document.querySelectorAll('nav a, .nav__item')].find((n) => n.textContent.includes('Profil')); el && el.click(); });
  await sleep(400);
  const profInfo = await page.evaluate(() => ({
    card: !!document.querySelector('.profile-card'),
    langBtns: document.querySelectorAll('.lang-pick__btn').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  check(`${kind} profile card`, profInfo.card);
  check(`${kind} language buttons`, profInfo.langBtns === 2, `n=${profInfo.langBtns}`);
  check(`${kind} profile no overflow`, profInfo.overflow <= 0, `scrollW=${profInfo.overflow}`);
  const profFab = await page.evaluate(() => !!document.querySelector('.fab'));
  check(`${kind} fab hidden on profile`, !profFab);

  await page.close();
}

const fails = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - fails.length}/${checks.length} passed`);
await browser.close();

