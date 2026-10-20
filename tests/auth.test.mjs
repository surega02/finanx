import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import { createAuthSession } from '../src/lib/auth-session.js';
import * as format from '../src/lib/format.js';

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const userSession = (id) => ({ user: { id, email: `${id}@example.test` } });
const fakeStore = (id) => ({ id, deactivated: false, deactivate() { this.deactivated = true; } });

function harness(loadStore, initial = null) {
  let listener;
  let session = initial;
  let logoutError = null;
  let sessionError = null;
  let state;
  let loads = 0;
  const client = { auth: {
    onAuthStateChange(callback) { listener = callback; return { data: { subscription: { unsubscribe() {} } } }; },
    async getSession() { return { data: { session }, error: sessionError }; },
    async signOut() { if (!logoutError) session = null; return { error: logoutError }; },
  } };
  const controller = createAuthSession({ client, loadStore: (...args) => { loads++; return loadStore(...args); }, onChange: (next) => { state = next; } });
  controller.start();
  return {
    controller,
    get state() { return state; }, get loads() { return loads; },
    emit(next) { session = next; listener(next ? 'SIGNED_IN' : 'SIGNED_OUT', next); },
    setLogoutError(error) { logoutError = error; },
    setSessionError(error) { sessionError = error; },
  };
}

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
  const helpers = compile('../src/lib/supabase.js', { '@supabase/supabase-js': { createClient: () => null } }, { 'import.meta.env': '{}' });
  return { Store: compile('../src/lib/store.js', { './format.js': format, './supabase.js': helpers }).Store, cache };
}

function fakeCloud({ seedError = null, catsError = null, txError = null, writes = [] } = {}) {
  return {
    rpc: async () => ({ error: seedError }),
    from(table) {
      return {
        select() { return this; }, eq() { return this; }, order() { return this; },
        then(resolve) { resolve({ data: table === 'transactions' ? [{ id: 'private-A', date: '2026-10-20', category_id: 'expense_food' }] : [], error: table === 'transactions' ? txError : catsError }); },
        upsert(payload) { writes.push(payload); return Promise.resolve({ error: null }); },
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
  cache.set('finanx:v1', JSON.stringify(seed.state));
  const demo = Store.load();
  assert.equal(demo.state.language, 'en');
  assert.equal(cache.has('finanx:v1'), false);
  const before = cache.get('finanx:demo:v1');
  const cloud = await Store.loadCloud(fakeCloud(), { id: 'A' });
  cloud.persist();
  assert.equal(cache.get('finanx:demo:v1'), before);
  assert.equal(cache.has('finanx:v1'), false);
});

test('cloud seed and query failures reject instead of creating empty successful data', async () => {
  const { Store, cache } = storeHarness();
  for (const key of ['seedError', 'catsError', 'txError']) {
    const error = new Error(key);
    await assert.rejects(Store.loadCloud(fakeCloud({ [key]: error }), { id: 'A' }), error);
  }
  assert.equal(cache.size, 0);
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
