import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { cloudError, retryCloudLoad } from '../src/lib/cloud-load.js';

test('real SDK fetch failure reproduces blank seed code and is safely classified', async () => {
  let calls = 0;
  const client = createClient('https://example.supabase.co', 'synthetic-test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async () => { calls++; throw new TypeError('Failed to fetch'); } },
  });
  const result = await client.rpc('ensure_system_categories', { uid: 'synthetic-owner' });
  assert.equal(calls, 1, 'SDK does not retry POST RPC network failures');
  assert.equal(result.status, 0);
  assert.equal(result.error.code, '');
  const failure = cloudError('categoriesSeed', result.error, result.status);
  assert.equal(failure.code, 'NETWORK');
  assert.equal(failure.stage, 'categoriesSeed');
});

test('transient network failure retries idempotent request and returns confirmed result', async () => {
  let calls = 0;
  const delays = [];
  const response = { data: { categories: [], transactions: [], settings: null }, error: null };
  const result = await retryCloudLoad('snapshotRead', () => {
    calls++;
    if (calls === 1) return { error: { message: 'TypeError: Failed to fetch', code: '' }, status: 0 };
    if (calls === 2) throw new TypeError('Network request failed');
    return response;
  }, async ms => delays.push(ms));
  assert.equal(calls, 3);
  assert.deepEqual(delays, [300, 900]);
  assert.equal(result, response);
});

test('persistent connection failures stop after three attempts without retaining private details', async () => {
  let calls = 0;
  await assert.rejects(retryCloudLoad('categoriesSeed', () => {
    calls++;
    return { status: 0, error: { message: 'TypeError: Failed to fetch https://private.example/?token=SECRET', details: 'PRIVATE SQL', code: '' } };
  }, async () => {}), error => {
    assert.equal(error.code, 'NETWORK');
    assert.equal(error.stage, 'categoriesSeed');
    assert.equal(`${error.message} ${JSON.stringify(error)}`.includes('SECRET'), false);
    assert.equal(JSON.stringify(error).includes('PRIVATE'), false);
    return true;
  });
  assert.equal(calls, 3);
});

test('permissions, constraints, cancellation and browser errors are not retried', async () => {
  const fixtures = [
    [{ code: '42501', message: 'PRIVATE SQL' }, 403, '42501'],
    [{ code: '23505' }, 409, '23505'],
    [{ code: '42P10' }, 400, '42P10'],
    [{ code: 'PGRST202' }, 404, 'PGRST202'],
    [{ message: 'AbortError: signal is aborted', code: '' }, 0, 'ABORTED'],
    [new TypeError('Unsupported browser API'), undefined, 'CLIENTERR'],
    [{ message: 'ReferenceError: Headers is not defined' }, 0, 'CLIENTERR'],
    [{ message: 'Unclassified transport error', code: '' }, 0, 'REQUESTFAIL'],
    [{ message: 'PRIVATE HTML', code: '' }, 401, 'HTTP401'],
  ];
  for (const [failure, status, code] of fixtures) {
    let calls = 0;
    await assert.rejects(retryCloudLoad('categoriesSeed', () => {
      calls++;
      return { error: failure, status };
    }, async () => assert.fail('must not back off')), error => error.code === code);
    assert.equal(calls, 1);
  }
});

test('temporary gateway failures retry without exposing response body', async () => {
  let calls = 0;
  await assert.rejects(retryCloudLoad('snapshotRead', () => {
    calls++;
    return { status: 503, error: { message: '<html>PRIVATE UPSTREAM</html>' } };
  }, async () => {}), error => error.code === 'HTTP503' && !error.message.includes('PRIVATE'));
  assert.equal(calls, 3);
});
