import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import { createAuthSession } from '../src/lib/auth-session.js';
import * as format from '../src/lib/format.js';
import * as ledger from '../src/lib/ledger.js';
import * as cloudLoad from '../src/lib/cloud-load.js';
import * as authCallback from '../src/lib/auth-callback.js';

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const userSession = (id) => ({ user: { id, email: `${id}@example.test` } });
const fakeStore = (id) => ({ id, deactivated: false, deactivate() { this.deactivated = true; } });

function harness(loadStore, initial = null, { initialize = async () => ({ error: null }), getSession, callbackExpected = false } = {}) {
  let listener;
  let session = initial;
  let logoutError = null;
  let sessionError = null;
  let state;
  let loads = 0;
  const client = { auth: {
    initialize,
    onAuthStateChange(callback) { listener = callback; return { data: { subscription: { unsubscribe() {} } } }; },
    getSession: getSession || (async () => ({ data: { session }, error: sessionError })),
    async signOut() { if (!logoutError) session = null; return { error: logoutError }; },
  } };
  const controller = createAuthSession({ client, callbackExpected, loadStore: (...args) => { loads++; return loadStore(...args); }, onChange: (next) => { state = next; } });
  controller.start();
  return {
    controller,
    get state() { return state; }, get loads() { return loads; },
    emit(next) { session = next; listener(next ? 'SIGNED_IN' : 'SIGNED_OUT', next); },
    emitInitial(next) { listener('INITIAL_SESSION', next); },
    setLogoutError(error) { logoutError = error; },
    setSessionError(error) { sessionError = error; },
  };
}

test('new OAuth logins use PKCE and existing implicit callbacks remain supported', () => {
  assert.equal(authCallback.authCallbackOptions(null).auth.flowType, 'pkce');
  assert.equal(authCallback.authCallbackOptions({ search: '?code=synthetic', hash: '' }).callbackExpected, true);
  const legacy = authCallback.authCallbackOptions({ hash: '#access_token=synthetic&refresh_token=synthetic' });
  assert.equal(legacy.auth.flowType, 'implicit');
  assert.equal(legacy.callbackExpected, true);
  assert.equal(authCallback.authCallbackOptions({ search: '?view=transactions' }).callbackExpected, false);
});

test('callback waits for SDK initialization and opens the authenticated store', async () => {
  const init = deferred();
  const h = harness((_, user) => fakeStore(user.id), userSession('A'), {
    initialize: () => init.promise, callbackExpected: true,
  });
  try {
    h.emitInitial(null);
    await tick();
    assert.equal(h.state.status, 'loading');
    assert.equal(h.loads, 0);
    init.resolve({ error: null });
    await tick();
    assert.equal(h.state.status, 'ready');
    assert.equal(h.state.store.id, 'A');
    assert.equal(h.loads, 1);
  } finally { h.controller.stop(); }
});

test('callback initialization errors are visible instead of a silent signed-out session', async () => {
  const init = deferred();
  const h = harness((_, user) => fakeStore(user.id), null, {
    initialize: () => init.promise, callbackExpected: true,
  });
  try {
    h.emitInitial(null);
    init.resolve({ error: new Error('PRIVATE OAuth callback details') });
    await tick();
    h.emitInitial(null);
    assert.equal(h.state.status, 'signedOut');
    assert.equal(h.state.error, 'signInCallbackFailed');
    assert.equal(h.loads, 0);
    assert.equal(JSON.stringify(h.state).includes('PRIVATE'), false);
    h.emit(userSession('B'));
    await tick();
    assert.equal(h.state.status, 'ready');
    assert.equal(h.state.store.id, 'B');
  } finally { h.controller.stop(); }
});

test('callback without a session is reported, ordinary signed-out startup is not', async () => {
  for (const callbackExpected of [false, true]) {
    const h = harness(() => fakeStore('A'), null, { callbackExpected });
    try {
      await tick();
      assert.equal(h.state.status, 'signedOut');
      assert.equal(h.state.error, callbackExpected ? 'signInCallbackFailed' : null);
      assert.equal(h.loads, 0);
    } finally { h.controller.stop(); }
  }
});

test('newer auth events win over delayed startup and stale INITIAL_SESSION', async () => {
  for (const next of [null, userSession('B')]) {
    const init = deferred();
    const h = harness((_, user) => fakeStore(user.id), userSession('A'), { initialize: () => init.promise });
    try {
      h.emit(next);
      init.resolve({ error: null });
      await tick();
      h.emitInitial(userSession('A'));
      assert.equal(h.state.status, next ? 'ready' : 'signedOut');
      assert.equal(h.state.user?.id ?? null, next?.user.id ?? null);
    } finally { h.controller.stop(); }
  }
});

test('account switch clears A immediately and only opens B with B data', async () => {
  const b = deferred();
  const aStore = fakeStore('A');
  const h = harness((_, user) => user.id === 'A' ? aStore : b.promise, userSession('A'));
  try {
    await tick();
    assert.equal(h.state.store.id, 'A');
    h.emit(userSession('B'));
    assert.equal(h.state.store, null);
    assert.equal(h.state.status, 'loading');
    assert.equal(aStore.deactivated, true);
    await tick();
    b.resolve(fakeStore('B'));
    await tick();
    assert.equal(h.state.user.id, 'B');
    assert.equal(h.state.store.id, 'B');
    h.emit({ user: { id: 'B', email: 'updated@example.test' } });
    await tick();
    assert.equal(h.loads, 2, 'same UID token refresh must not reload data');
  } finally { h.controller.stop(); }
});

test('session arriving in an initially signed-out tab loads its cloud store', async () => {
  const h = harness((_, user) => fakeStore(user.id));
  try {
    await tick();
    assert.equal(h.state.status, 'signedOut');
    h.emit(userSession('B'));
    await tick();
    assert.equal(h.state.store.id, 'B');
  } finally { h.controller.stop(); }
});

test('logout and newer accounts invalidate pending hydration', async () => {
  for (const replacement of [null, userSession('B')]) {
    const pending = deferred();
    const oldStore = fakeStore('A');
    const h = harness((_, user) => user.id === 'A' ? pending.promise : fakeStore('B'), userSession('A'));
    try {
      await tick();
      h.emit(replacement);
      pending.resolve(oldStore);
      await tick();
      assert.equal(oldStore.deactivated, true);
      assert.equal(h.state.user?.id ?? null, replacement?.user.id ?? null);
      assert.equal(h.state.store?.id ?? null, replacement?.user.id ?? null);
    } finally { h.controller.stop(); }
  }
});

test('loading failure closes data and supports retry', async () => {
  let fail = true;
  const h = harness(() => { if (fail) throw new Error('query failed'); return fakeStore('A'); }, userSession('A'));
  try {
    await tick();
    assert.equal(h.state.status, 'error');
    assert.equal(h.state.store, null);
    fail = false;
    await h.controller.retry();
    await tick();
    assert.equal(h.state.status, 'ready');
    assert.equal(h.state.store.id, 'A');
    h.setSessionError(new Error('session failed'));
    await h.controller.retry();
    assert.equal(h.state.status, 'error');
    assert.equal(h.state.store, null);
  } finally { h.controller.stop(); }
});

test('failed logout closes data and ignores auth events until logout succeeds', async () => {
  const pending = deferred();
  const oldStore = fakeStore('A');
  const h = harness(() => pending.promise, userSession('A'));
  try {
    await tick();
    h.setLogoutError(new Error('revoke failed'));
    await h.controller.signOut();
    pending.resolve(oldStore);
    await tick();
    assert.equal(oldStore.deactivated, true);
    assert.equal(h.state.error, 'logoutFailed');
    await h.controller.retry();
    assert.equal(h.state.error, 'logoutFailed', 'data retry must not reopen a pending logout');
    h.emit(userSession('A'));
    await tick();
    assert.equal(h.state.store, null);
    assert.equal(h.state.error, 'logoutFailed');
    h.setLogoutError(null);
    await h.controller.signOut();
    assert.equal(h.state.status, 'signedOut');
  } finally { h.controller.stop(); }
});

test('stopped controller cannot publish delayed results', async () => {
  const pending = deferred();
  const h = harness(() => pending.promise, userSession('A'));
  await tick();
  const state = h.state;
  h.controller.stop();
  const store = fakeStore('A');
  pending.resolve(store);
  await tick();
  assert.equal(h.state, state);
  assert.equal(store.deactivated, true);
});

function storeHarness() {
  const cache = new Map();
  const localStorage = { getItem: (key) => cache.get(key) ?? null, setItem: (key, value) => cache.set(key, value), removeItem: (key) => cache.delete(key) };
  const compile = (path, modules, define = {}) => {
    const code = transformSync(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), { format: 'cjs', define }).code;
    const sandbox = { module: { exports: {} }, require: (name) => modules[name], localStorage };
    vm.runInNewContext(code, sandbox);
    return sandbox.module.exports;
  };
  const helpers = compile('../src/lib/supabase.js', { './auth-callback.js': authCallback, '@supabase/supabase-js': { createClient: () => null } }, { 'import.meta.env': '{}' });
  return { Store: compile('../src/lib/store.js', { './format.js': format, './supabase.js': helpers, './ledger.js': ledger, './cloud-load.js': cloudLoad }).Store, cache };
}

function fakeCloud({ seedError = null, catsError = null, txError = null, writeError = null, writes = [] } = {}) {
  let owner;
  return {
    rpc: async (name, args) => {
      if (name === 'ensure_system_categories') { owner = args.uid; return { error: seedError }; }
      return { data: { categories: [], transactions: [{ id: 'private-A', user_id: owner, amount: '123', type: 'expense', date: '2026-10-20', category_id: 'expense_food' }], settings: null }, error: catsError || txError };
    },
    from(table) {
      return {
        select() { return this; }, eq() { return this; }, order() { return this; },
        then(resolve) { resolve({ data: table === 'transactions' ? [{ id: 'private-A', date: '2026-10-20', category_id: 'expense_food' }] : [], error: table === 'transactions' ? txError : catsError }); },
        upsert(payload, options) { writes.push({ payload, options }); return Promise.resolve({ error: writeError }); },
      };
    },
  };
}

test('legacy cloud cache is removed and cannot open through demo', () => {
  const { Store, cache } = storeHarness();
  cache.set('finanx:v1', JSON.stringify({ user: { uid: 'A' }, transactions: [{ description: 'PRIVATE_A' }] }));
  const demo = Store.load();
  assert.equal(cache.has('finanx:v1'), false);
  assert.equal(demo.state.user.uid, 'demo-uid');
  assert.equal(JSON.stringify(demo.state).includes('PRIVATE_A'), false);
});

test('legacy demo migrates and remains separate from cloud persistence', async () => {
  const { Store, cache } = storeHarness();
  const seed = Store.load();
  seed.data.language = 'en';
  cache.delete('finanx:demo:v2');
  cache.set('finanx:v1', JSON.stringify(seed.state));
  const demo = Store.load();
  assert.equal(demo.state.language, 'en');
  assert.equal(cache.has('finanx:v1'), true, 'known demo migration source is preserved');
  const before = cache.get('finanx:demo:v2');
  const cloud = await Store.loadCloud(fakeCloud(), { id: 'A' });
  cloud.persist();
  assert.equal(cache.get('finanx:demo:v2'), before);
  assert.equal(cache.has('finanx:v1'), true);
});

test('cloud seed and query failures reject instead of creating empty successful data', async () => {
  const { Store, cache } = storeHarness();
  for (const key of ['seedError', 'catsError', 'txError']) {
    const error = new Error(key);
    await assert.rejects(Store.loadCloud(fakeCloud({ [key]: error }), { id: 'A' }), (failure) => {
      assert.equal(failure.code, 'UNKNOWN');
      assert.equal(failure.stage, { seedError: 'categoriesSeed', catsError: 'snapshotRead', txError: 'snapshotRead' }[key]);
      return true;
    });
  }
  assert.equal(cache.size, 0);
});

test('missing seed RPC uses per-user conflict key without overwriting data', async () => {
  const { Store, cache } = storeHarness();
  for (const code of ['PGRST202', '42883']) {
    const writes = [];
    const store = await Store.loadCloud(fakeCloud({ seedError: { code }, writes }), { id: 'B' });
    assert.equal(store.state.user.uid, 'B');
    assert.equal(writes.length, 1);
    assert.equal(writes[0].payload.length, 13);
    assert.ok(writes[0].payload.every((row) => row.user_id === 'B'));
    assert.equal(writes[0].options.onConflict, 'user_id,id');
    assert.equal(writes[0].options.ignoreDuplicates, true);
  }
  assert.equal(cache.size, 0);
});

test('fallback rejects incompatible schemas and RLS errors without leaking raw details', async () => {
  const { Store } = storeHarness();
  for (const code of ['42P10', '23505', '42501']) {
    await assert.rejects(Store.loadCloud(fakeCloud({ seedError: { code: 'PGRST202' }, writeError: { code, message: 'PRIVATE SQL' } }), { id: 'B' }), (error) => {
      assert.equal(error.code, code);
      assert.equal(error.stage, 'categoriesSeed');
      assert.equal(error.message.includes('PRIVATE SQL'), false);
      return true;
    });
  }
  const writes = [];
  await assert.rejects(Store.loadCloud(fakeCloud({ seedError: { code: '42501' }, writes }), { id: 'B' }));
  assert.equal(writes.length, 0, 'permission failure must not trigger fallback');
});

test('account loading retains only safe diagnostic stage and code', async () => {
  const h = harness(() => { throw Object.assign(new Error('PRIVATE SQL'), { code: '23505', stage: 'categoriesSeed' }); }, userSession('B'));
  try {
    await tick();
    assert.equal(h.state.status, 'error');
    assert.deepEqual(h.state.diagnostic, { stage: 'categoriesSeed', code: '23505' });
    assert.equal(JSON.stringify(h.state).includes('PRIVATE SQL'), false);
  } finally { h.controller.stop(); }
});

test('deactivated stores cannot write data or profiles', async () => {
  const { Store, cache } = storeHarness();
  const writes = [];
  const store = await Store.loadCloud(fakeCloud({ writes }), { id: 'A' });
  store.deactivate();
  store.setLanguage('en');
  store.addCategory({ name: 'Stale', type: 'expense', icon: 'coffee' });
  assert.equal(writes.length, 0);
  assert.equal(cache.size, 0);
  assert.equal(store.state.user, null);
});
