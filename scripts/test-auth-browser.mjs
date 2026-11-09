import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

// Real React application and Supabase SDK; only external OAuth/API responses
// are synthetic. No Google account, production tokens, or database is used.
const base = 'http://127.0.0.1:5181';
const authOrigin = 'https://auth.finanx.test';
const outDir = '.impeccable/review/auth-dist';
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', outDir], {
  env: { ...process.env, VITE_SUPABASE_URL: authOrigin, VITE_SUPABASE_ANON_KEY: 'synthetic-test-key' },
  windowsHide: true, stdio: 'ignore',
});
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', outDir, '--host', '127.0.0.1', '--port', '5181', '--strictPort'], {
  windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
const user = {
  id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated',
  email: 'oauth-fixture@example.test', created_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'google', providers: ['google'] }, user_metadata: { full_name: 'OAuth Fixture' },
};
const exp = Math.floor(Date.now() / 1000) + 3600;
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp, role: 'authenticated' })}.synthetic`;
const session = { access_token: accessToken, refresh_token: 'synthetic-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: exp, user };
const errors = [];
let browser;

async function scenario(run, { exchangeFails = false } = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const calls = { authorize: 0, exchange: 0, seed: 0, snapshot: 0 };
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', async request => {
    const url = new URL(request.url());
    if (url.origin === base) return request.continue();
    if (url.origin !== authOrigin) return request.abort();
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    const json = (body, status = 200) => request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
    try {
      if (request.method() === 'OPTIONS') return await request.respond({ status: 204, headers });
      if (url.pathname === '/auth/v1/authorize') {
        calls.authorize++;
        assert.equal(url.searchParams.get('provider'), 'google');
        assert.equal(url.searchParams.get('code_challenge_method'), 's256');
        assert.ok(url.searchParams.get('code_challenge'));
        const redirect = new URL(url.searchParams.get('redirect_to'));
        assert.equal(redirect.origin, base);
        redirect.searchParams.set('code', 'synthetic-authorization-code');
        return await request.respond({ status: 302, headers: { location: redirect.href } });
      }
      if (url.pathname === '/auth/v1/token') {
        calls.exchange++;
        assert.equal(url.searchParams.get('grant_type'), 'pkce');
        const body = JSON.parse(request.postData());
        assert.equal(body.auth_code, 'synthetic-authorization-code');
        assert.ok(body.code_verifier.length >= 43);
        await new Promise(resolve => setTimeout(resolve, 200));
        return await json(exchangeFails ? { code: 'bad_code_verifier', msg: 'PRIVATE callback details' } : session, exchangeFails ? 400 : 200);
      }
      if (url.pathname === '/auth/v1/user') return await json(user);
      if (url.pathname === '/rest/v1/rpc/ensure_system_categories') { calls.seed++; return await json(null); }
      if (url.pathname === '/rest/v1/rpc/ledger_snapshot_v2') {
        calls.snapshot++;
        return await json({ categories: [], transactions: [], settings: null });
      }
      throw new Error(`Unexpected mocked endpoint: ${url.pathname}`);
    } catch (error) {
      errors.push(error.message);
      await json({ msg: 'Fixture failed' }, 500);
    }
  });
  try { await run(page, calls); } finally { await context.close(); }
}

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Auth preview timeout')), 15000);
    server.stdout.on('data', data => { if (data.toString().includes('Local:')) { clearTimeout(timer); resolve(); } });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Auth preview exited: ${code}`)); });
  });
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  await scenario(async (page, calls) => {
    await page.goto(base);
    await page.waitForSelector('.login__google');
    await page.click('.login__google');
    await page.waitForSelector('.app');
    assert.equal(await page.$('.login'), null);
    assert.equal(calls.authorize, 1);
    assert.equal(calls.exchange, 1);
    assert.equal(calls.snapshot, 1);
    assert.equal(new URL(page.url()).searchParams.has('code'), false);
    await page.reload();
    await page.waitForSelector('.app');
    assert.equal(calls.exchange, 1, 'reload restores the persisted session without exchanging the code again');
    console.log('PASS Google PKCE callback opens dashboard and survives reload');
  });
  await scenario(async (page, calls) => {
    await page.goto(base);
    await page.waitForSelector('.login__google');
    await page.click('.login__google');
    await page.waitForSelector('.login [role="alert"]');
    assert.match(await page.$eval('.login [role="alert"]', el => el.textContent), /Login Google belum selesai/);
    assert.equal(calls.snapshot, 0);
    assert.equal(await page.$('.app'), null);
    assert.equal(await page.$eval('.login__google', el => el.disabled), false);
    assert.ok(!(await page.content()).includes('PRIVATE callback details'));
    console.log('PASS failed exchange explains the failure and allows a fresh login');
  }, { exchangeFails: true });
  await scenario(async (page, calls) => {
    await page.goto(`${base}/?code=missing-verifier`);
    await page.waitForSelector('.login [role="alert"]');
    assert.equal(calls.snapshot, 0);
    assert.equal(new URL(page.url()).searchParams.has('code'), false);
    console.log('PASS callback without verifier cannot silently return to login');
  });
  await scenario(async (page, calls) => {
    await page.goto(`${base}/#error=access_denied&error_description=PRIVATE%20provider%20details`);
    await page.waitForSelector('.login [role="alert"]');
    assert.equal(calls.snapshot, 0);
    assert.equal(new URL(page.url()).hash, '');
    assert.ok(!(await page.content()).includes('PRIVATE provider details'));
    console.log('PASS denied OAuth callback shows a safe error and clears the URL');
  });
  await scenario(async (page, calls) => {
    const hash = new URLSearchParams({ access_token: accessToken, refresh_token: session.refresh_token, token_type: 'bearer', expires_in: '3600' });
    await page.goto(`${base}/#${hash}`);
    await page.waitForSelector('.app');
    assert.equal(calls.exchange, 0);
    assert.equal(calls.snapshot, 1);
    assert.equal(new URL(page.url()).hash, '');
    console.log('PASS in-flight legacy implicit login remains compatible');
  });
  assert.deepEqual(errors, []);
} finally {
  if (browser) await browser.close();
  server.kill();
}
