import { todayISO, monthRangeISO } from './format.js';
import { appUserFromAuth, txToRow, catToRow, profileRow, rowToTx, rowToCat } from './supabase.js';
import { migrateDemo, emptySettings, validateSettings, integer, validDate, totals } from './ledger.js';

const SYSTEM_CATEGORIES = [
  { id: 'income_salary', type: 'income', name: 'Salary', nameId: 'Gaji', icon: 'wallet', source: 'system' },
  { id: 'income_business', type: 'income', name: 'Business', nameId: 'Usaha', icon: 'briefcase', source: 'system' },
  { id: 'income_bonus', type: 'income', name: 'Bonus', nameId: 'Bonus', icon: 'gift', source: 'system' },
  { id: 'income_gift', type: 'income', name: 'Gift', nameId: 'Hadiah', icon: 'present', source: 'system' },
  { id: 'income_other', type: 'income', name: 'Other', nameId: 'Lainnya', icon: 'coins', source: 'system' },
  { id: 'expense_food', type: 'expense', name: 'Food', nameId: 'Makanan', icon: 'utensils', source: 'system' },
  { id: 'expense_transportation', type: 'expense', name: 'Transportation', nameId: 'Transportasi', icon: 'car', source: 'system' },
  { id: 'expense_shopping', type: 'expense', name: 'Shopping', nameId: 'Belanja', icon: 'bag', source: 'system' },
  { id: 'expense_bills', type: 'expense', name: 'Bills', nameId: 'Tagihan', icon: 'receipt', source: 'system' },
  { id: 'expense_entertainment', type: 'expense', name: 'Entertainment', nameId: 'Hiburan', icon: 'gamepad', source: 'system' },
  { id: 'expense_health', type: 'expense', name: 'Health', nameId: 'Kesehatan', icon: 'heart', source: 'system' },
  { id: 'expense_education', type: 'expense', name: 'Education', nameId: 'Pendidikan', icon: 'book', source: 'system' },
  { id: 'expense_other', type: 'expense', name: 'Other', nameId: 'Lainnya', icon: 'ellipsis', source: 'system' },
];

const CUSTOM_CATEGORIES = [
  { id: 'expense_coffee', type: 'expense', name: 'Coffee', nameId: 'Kopi', icon: 'coffee', source: 'user' },
  { id: 'expense_gaming', type: 'expense', name: 'Gaming', nameId: 'Gaming', icon: 'controller', source: 'user' },
  { id: 'expense_pets', type: 'expense', name: 'Pets', nameId: 'Hewan', icon: 'paw', source: 'user' },
  { id: 'income_freelance', type: 'income', name: 'Freelance', nameId: 'Freelance', icon: 'laptop', source: 'user' },
];

function iso(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CAT = {
  food: { id: 'expense_food', source: 'system', name: 'Food', nameId: 'Makanan', icon: 'utensils' },
  transport: { id: 'expense_transportation', source: 'system', name: 'Transportation', nameId: 'Transportasi', icon: 'car' },
  shopping: { id: 'expense_shopping', source: 'system', name: 'Shopping', nameId: 'Belanja', icon: 'bag' },
  bills: { id: 'expense_bills', source: 'system', name: 'Bills', nameId: 'Tagihan', icon: 'receipt' },
  ent: { id: 'expense_entertainment', source: 'system', name: 'Entertainment', nameId: 'Hiburan', icon: 'gamepad' },
  health: { id: 'expense_health', source: 'system', name: 'Health', nameId: 'Kesehatan', icon: 'heart' },
  edu: { id: 'expense_education', source: 'system', name: 'Education', nameId: 'Pendidikan', icon: 'book' },
  coffee: { id: 'expense_coffee', source: 'user', name: 'Coffee', nameId: 'Kopi', icon: 'coffee' },
  gaming: { id: 'expense_gaming', source: 'user', name: 'Gaming', nameId: 'Gaming', icon: 'controller' },
  pets: { id: 'expense_pets', source: 'user', name: 'Pets', nameId: 'Hewan', icon: 'paw' },
  salary: { id: 'income_salary', source: 'system', name: 'Salary', nameId: 'Gaji', icon: 'wallet' },
  freelance: { id: 'income_freelance', source: 'user', name: 'Freelance', nameId: 'Freelance', icon: 'laptop' },
  gift: { id: 'income_gift', source: 'system', name: 'Gift', nameId: 'Hadiah', icon: 'present' },
};

const SEED = [
  { id: 't01', type: 'expense', amount: 25000, date: iso(0), category: CAT.coffee, description: 'Kopi pagi' },
  { id: 't02', type: 'expense', amount: 68000, date: iso(0), category: CAT.food, description: 'Makan siang' },
  { id: 't03', type: 'expense', amount: 12000, date: iso(1), category: CAT.transport, description: 'Gojek' },
  { id: 't04', type: 'expense', amount: 240000, date: iso(2), category: CAT.shopping, description: 'Tas' },
  { id: 't05', type: 'expense', amount: 85000, date: iso(3), category: CAT.food, description: 'Makan malam' },
  { id: 't06', type: 'expense', amount: 500000, date: iso(4), category: CAT.bills, description: 'Listrik' },
  { id: 't07', type: 'expense', amount: 150000, date: iso(5), category: CAT.gaming, description: 'Steam' },
  { id: 't08', type: 'expense', amount: 45000, date: iso(6), category: CAT.pets, description: 'Kucing' },
  { id: 't09', type: 'expense', amount: 90000, date: iso(7), category: CAT.health, description: 'Obat' },
  { id: 't10', type: 'expense', amount: 300000, date: iso(8), category: CAT.edu, description: 'Buku' },
  { id: 't11', type: 'expense', amount: 35000, date: iso(9), category: CAT.food, description: 'Kopi' },
  { id: 't12', type: 'expense', amount: 75000, date: iso(10), category: CAT.transport, description: 'Bensin' },
  { id: 't13', type: 'income', amount: 12500000, date: iso(11), category: CAT.salary, description: 'Gaji Agustus' },
  { id: 't14', type: 'income', amount: 1800000, date: iso(12), category: CAT.freelance, description: 'Proyek website' },
  { id: 't15', type: 'expense', amount: 220000, date: iso(13), category: CAT.ent, description: 'Bioskop' },
  { id: 't16', type: 'expense', amount: 120000, date: iso(14), category: CAT.shopping, description: 'Kaos' },
  { id: 't17', type: 'expense', amount: 60000, date: iso(16), category: CAT.food, description: 'Makan siang' },
  { id: 't18', type: 'expense', amount: 40000, date: iso(17), category: CAT.transport, description: 'Taksi' },
  { id: 't19', type: 'income', amount: 200000, date: iso(18), category: CAT.gift, description: 'Hadiah ulang tahun' },
  { id: 't20', type: 'expense', amount: 320000, date: iso(20), category: CAT.bills, description: 'Internet' },
  { id: 't21', type: 'expense', amount: 50000, date: iso(22), category: CAT.coffee, description: 'Kopi' },
  { id: 't22', type: 'expense', amount: 180000, date: iso(24), category: CAT.food, description: 'Makan keluarga' },
  { id: 't23', type: 'expense', amount: 95000, date: iso(27), category: CAT.health, description: 'Vitamin' },
  { id: 't24', type: 'expense', amount: 65000, date: iso(30), category: CAT.ent, description: 'Konser' },
  { id: 't25', type: 'income', amount: 12500000, date: iso(33), category: CAT.salary, description: 'Gaji Juli' },
  { id: 't26', type: 'expense', amount: 400000, date: iso(35), category: CAT.shopping, description: 'Sepatu' },
  { id: 't27', type: 'expense', amount: 110000, date: iso(38), category: CAT.food, description: 'Makan siang' },
  { id: 't28', type: 'expense', amount: 550000, date: iso(40), category: CAT.bills, description: 'Sewa kos' },
  { id: 't29', type: 'expense', amount: 250000, date: iso(44), category: CAT.ent, description: 'Liburan' },
  { id: 't30', type: 'expense', amount: 80000, date: iso(48), category: CAT.food, description: 'Makan malam' },
].map((t) => ({
  ...t,
  created_at: new Date(t.date).toISOString(),
  updated_at: new Date(t.date).toISOString(),
  deleted_at: null,
}));

const KEY = 'finanx:demo:v2';
const V1_KEY = 'finanx:demo:v1';
const LEGACY_KEY = 'finanx:v1';

function makeTimestamp() {
  return new Date().toISOString();
}

function normalizeName(name) {
  return name.trim().toLowerCase();
}

export function seedData() {
  return {
    user: {
      uid: 'demo-uid',
      name: 'Ega',
      email: 'ega@finanx.app',
      photo: null,
      created_at: '2024-03-12T09:00:00Z',
      updated_at: '2026-08-16T10:00:00Z',
    },
    transactions: SEED,
    categories: [...SYSTEM_CATEGORIES, ...CUSTOM_CATEGORIES],
    language: 'id',
    schemaVersion: 2,
    financialSettings: emptySettings(),
  };
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function cloudError(stage, error) {
  const failure = new Error('Cloud account loading failed');
  failure.stage = stage;
  // Preserve a diagnostic code, never SQL details, tokens, or personal data.
  failure.code = /^[A-Z0-9]{4,12}$/.test(error?.code || '') ? error.code : 'UNKNOWN';
  return failure;
}

export class Store {
  constructor(initial, opts = {}) {
    this.data = deepClone(initial);
    this._changed = false;
    this._supabase = opts.supabase || null;
    this._userId = opts.userId || null;
    this._transient = !!opts.transient;
    this._inactive = false;
    this.revision = 0;
    this.listeners = new Set();
    this.pendingCreates = new Map();
  }

  static empty() {
    return new Store({ user: null, transactions: [], categories: [], language: 'id' }, { transient: true });
  }

  static clearLegacyCache() {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw && JSON.parse(raw).user?.uid !== 'demo-uid') localStorage.removeItem(LEGACY_KEY);
    } catch { /* preserve unreadable sources for recovery */ }
  }

  static load() {
    try {
      Store.clearLegacyCache();
      const raw = localStorage.getItem(KEY);
      if (raw) return new Store(migrateDemo(JSON.parse(raw)));
      const source = localStorage.getItem(V1_KEY) || localStorage.getItem(LEGACY_KEY);
      const data = source ? migrateDemo(JSON.parse(source)) : seedData();
      const encoded = JSON.stringify(data);
      localStorage.setItem(KEY, encoded);
      if (localStorage.getItem(KEY) !== encoded) throw new Error('storage');
      return new Store(data);
    } catch (cause) {
      throw new Error('demoMigrationFailed', { cause });
    }
  }

  static async loadCloud(supabase, authUser) {
    const user = appUserFromAuth(authUser);
    const store = new Store(seedData(), { supabase, userId: user.uid });
    store.data.user = user;

    const uid = user.uid;
    const seedRes = await supabase.rpc('ensure_system_categories', { uid });
    if (seedRes.error) {
      if (['PGRST202', '42883'].includes(seedRes.error.code)) {
        // Older deployments may not have the RPC. Use the same per-user key,
        // enforced by RLS; never fall back to demo data or overwrite categories.
        const fallback = await supabase.from('categories').upsert(
          SYSTEM_CATEGORIES.map((category) => catToRow(category, uid)),
          { onConflict: 'user_id,id', ignoreDuplicates: true }
        );
        if (fallback.error) throw cloudError('categoriesSeed', fallback.error);
      } else {
        throw cloudError('categoriesSeed', seedRes.error);
      }
    }

    const snapshot = await Store.readSnapshot(supabase, uid);
    store.data = deepClone({ user, ...snapshot, language: 'id', schemaVersion: 2 });
    store._supabase = supabase;
    store._userId = uid;
    return store;
  }

  static async readSnapshot(client, uid) {
    const result = await client.rpc('ledger_snapshot_v2');
    if (result.error) throw cloudError('snapshotRead', result.error);
    const data = result.data;
    if (!Array.isArray(data?.categories) || !Array.isArray(data?.transactions)) throw new Error('Invalid snapshot');
    if ([...data.categories, ...data.transactions].some(r => r.user_id !== uid) || data.settings && data.settings.user_id !== uid) throw new Error('ownership');
    const categories = data.categories.map(rowToCat);
    const lookup = new Map(categories.map(c => [c.id, c]));
    const financialSettings = data.settings ? { openingBalanceAmount: data.settings.opening_balance_amount, openingBalanceDate: data.settings.opening_balance_date } : emptySettings();
    validateSettings(financialSettings);
    const transactions = data.transactions.map(r => rowToTx(r, lookup));
    for (const tx of transactions) integer(tx.amount);
    return { categories, transactions, financialSettings };
  }

  subscribe = (listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  notify() { this.revision++; for (const listener of this.listeners) listener(); }

  async exportSnapshot() {
    this.assertActive();
    const snapshot = this._supabase ? await Store.readSnapshot(this._supabase, this._userId) : deepClone(this.data);
    this.assertActive();
    return snapshot;
  }

  assertActive() { if (this._inactive) throw new Error('inactive'); }

  async setFinancialSettings(settings) {
    this.assertActive();
    validateSettings(settings);
    if (this._supabase) {
      const result = await this._supabase.from('financial_settings').upsert({ user_id: this._userId, opening_balance_amount: settings.openingBalanceAmount, opening_balance_date: settings.openingBalanceDate }, { onConflict: 'user_id' }).select('user_id');
      if (result.error || result.data?.length !== 1) throw new Error('saveFailed');
      this.assertActive();
    }
    this.commit({ ...this.data, financialSettings: deepClone(settings) });
  }

  commit(next) {
    this.assertActive();
    if (!this._supabase && !this._transient) localStorage.setItem(KEY, JSON.stringify(next));
    this.data = next;
    this.notify();
  }

  deactivate() {
    this._inactive = true;
    this.data = { user: null, transactions: [], categories: [], language: 'id' };
  }

  persist() {
    this.notify();
    if (this._supabase || this._transient || this._inactive) return;
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* V1 category/language persistence behavior; transaction and settings commits fail explicitly. */ }
  }

  _push(table, rows) {
    if (this._inactive || !this._supabase || !this._userId) return;
    const payload = (Array.isArray(rows) ? rows : [rows]).map((r) => ({ ...r, user_id: this._userId }));
    this._supabase.from(table).upsert(payload).then();
  }

  reset() {
    this.data = seedData();
    this.persist();
  }

  get state() {
    return this.data;
  }

  listActiveTransactions() {
    return this.data.transactions.filter((t) => !t.deleted_at);
  }

  listActiveCategories() {
    return this.data.categories.filter((c) => !c.deleted_at);
  }

  categoriesFor(type) {
    return this.listActiveCategories().filter((c) => c.type === type);
  }

  categoryName(cat, lang) {
    return lang === 'id' && cat.nameId ? cat.nameId : cat.name;
  }

  addTransaction({ type, amount, date, category, description }) {
    const id = `t_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const now = makeTimestamp();
    const tx = {
      id,
      type,
      amount,
      date,
      category: { id: category.id, source: category.source, name: category.name, nameId: category.nameId, icon: category.icon },
      description: description.trim(),
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    this.data.transactions.unshift(tx);
    this.persist();
    this._push('transactions', txToRow(tx, this._userId));
    return tx;
  }

  async saveTransaction(draft, id, editing = false) {
    this.assertActive();
    if (this.pendingCreates.has(id)) return this.pendingCreates.get(id);
    const operation = this._saveTransaction(draft, id, editing);
    this.pendingCreates.set(id, operation);
    try { return await operation; } finally { this.pendingCreates.delete(id); }
  }

  async _saveTransaction({ type, amount, date, category, description }, id, editing) {
    if (!['income', 'expense'].includes(type) || integer(amount) <= 0n || !validDate(date)) throw new Error('validation');
    const validCategory = this.categoriesFor(type).find(c => c.id === category?.id);
    if (!validCategory) throw new Error('category');
    const existing = this.data.transactions.find(t => t.id === id);
    const now = makeTimestamp();
    const snapshot = { id: validCategory.id, source: validCategory.source, name: validCategory.name, nameId: validCategory.nameId, icon: validCategory.icon };
    let tx = { id, type, amount, date, category: snapshot, description: description.trim(), created_at: existing?.created_at || now, updated_at: now, deleted_at: null };
    if (this._supabase) {
      // Check the same ID before every create retry; never overwrite a prior intent.
      const query = () => this._supabase.from('transactions').select('id,type,amount::text,date,category_id,description,created_at,updated_at,deleted_at').eq('user_id', this._userId).eq('id', id).maybeSingle();
      let found = editing ? null : await query();
      if (found?.error) throw new Error('saveFailed');
      if (!found?.data) {
        const payload = txToRow(tx, this._userId);
        const result = editing
          ? await this._supabase.from('transactions').update(payload).eq('user_id', this._userId).eq('id', id).select('id')
          : await this._supabase.from('transactions').upsert(payload, { onConflict: 'user_id,id', ignoreDuplicates: true });
        if (editing && (result.error || result.data?.length !== 1)) throw new Error('saveFailed');
        found = await query();
        if (found.error || !found.data) throw new Error('saveFailed');
      }
      this.assertActive();
      tx = rowToTx(found.data, new Map(this.data.categories.map(c => [c.id, c])));
      // Outcome already committed but draft edited before retry: do not silently discard edits.
      if (tx.type !== type || integer(tx.amount) !== integer(amount) || tx.date !== date || tx.category.id !== category.id || tx.description !== description.trim() || tx.deleted_at) throw new Error('intentConflict');
    }
    this.commit({ ...this.data, transactions: [tx, ...this.data.transactions.filter(t => t.id !== id)] });
    return tx;
  }

  updateTransaction(id, patch) {
    const tx = this.data.transactions.find((t) => t.id === id);
    if (!tx) return;
    Object.assign(tx, patch, { updated_at: makeTimestamp() });
    if (patch.category) {
      tx.category = {
        id: patch.category.id,
        source: patch.category.source,
        name: patch.category.name,
        nameId: patch.category.nameId,
        icon: patch.category.icon,
      };
    }
    this.persist();
    if (this._supabase) this._push('transactions', txToRow(tx, this._userId));
  }

  softDeleteTransaction(id) {
    return this.setTransactionDeletion(id, makeTimestamp());
  }

  undoDeleteTransaction(id) {
    return this.setTransactionDeletion(id, null);
  }

  async setTransactionDeletion(id, deleted_at) {
    this.assertActive();
    const tx = this.data.transactions.find((t) => t.id === id);
    if (!tx) return;
    const patch = { deleted_at, updated_at: makeTimestamp() };
    if (this._supabase) {
      const result = await this._supabase.from('transactions').update(patch).eq('user_id', this._userId).eq('id', id).select('id');
      if (result.error || result.data?.length !== 1) throw new Error('saveFailed');
      this.assertActive();
    }
    this.commit({ ...this.data, transactions: this.data.transactions.map(t => t.id === id ? { ...t, ...patch } : t) });
  }

  addCategory({ name, type, icon }) {
    const id = `${type}_${normalizeName(name)}`;
    const now = makeTimestamp();
    const cat = { id, type, name, nameId: name, icon, source: 'user', created_at: now, updated_at: now, deleted_at: null };
    this.data.categories.push(cat);
    this.persist();
    if (this._supabase) this._push('categories', catToRow(cat, this._userId));
    return cat;
  }

  softDeleteCategory(id) {
    const cat = this.data.categories.find((c) => c.id === id);
    if (!cat) return;
    cat.deleted_at = makeTimestamp();
    cat.updated_at = makeTimestamp();
    this.persist();
    if (this._supabase) this._push('categories', catToRow(cat, this._userId));
  }

  categoryNameExists(name, type) {
    const n = normalizeName(name);
    return this.listActiveCategories().some((c) => c.type === type && normalizeName(c.name) === n);
  }

  setLanguage(lang) {
    this.data.language = lang;
    this.persist();
    if (!this._inactive && this._supabase && this.data.user) {
      this._supabase.from('profiles').upsert(profileRow(this.data.user, lang)).then();
    }
  }

  summaryForMonth(year, monthIndex) {
    const { start, end } = monthRangeISO(year, monthIndex);
    return totals(this.data.transactions, start, end);
  }

  categoryTotals(map) {
    if (this._categoryRevision !== this.revision) {
      this._categoryLookup = new Map(this.data.categories.map(c => [c.id, c]));
      for (const tx of this.data.transactions) if (!this._categoryLookup.has(tx.category.id)) this._categoryLookup.set(tx.category.id, tx.category);
      this._categoryRevision = this.revision;
    }
    const lookup = this._categoryLookup;
    return Object.entries(map)
      .map(([id, total]) => ({ category: lookup.get(id), total }))
      .filter((x) => x.category)
      .sort((a, b) => a.total < b.total ? 1 : a.total > b.total ? -1 : 0);
  }

  counterforceMax() {
    if (this._maxRevision === this.revision) return this._maxAmount;
    const totals = new Map();
    for (const t of this.listActiveTransactions()) {
      const key = t.date.slice(0, 7);
      const cur = totals.get(key) || { income: 0n, expense: 0n };
      if (t.type === 'income') cur.income += integer(t.amount);
      else cur.expense += integer(t.amount);
      totals.set(key, cur);
    }
    let max = 1n;
    for (const { income, expense } of totals.values()) {
      if (income > max) max = income;
      if (expense > max) max = expense;
    }
    this._maxRevision = this.revision;
    this._maxAmount = max;
    return max;
  }
}

export function currentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

export const CATEGORY_ICONS = [
  'utensils', 'coffee', 'car', 'bag', 'receipt', 'gamepad', 'heart', 'book',
  'paw', 'controller', 'wallet', 'briefcase', 'gift', 'present', 'coins', 'laptop', 'ellipsis',
];
