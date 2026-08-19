import { todayISO, monthRangeISO } from './format.js';
import { appUserFromAuth, txToRow, catToRow, profileRow, rowToTx, rowToCat } from './supabase.js';

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

const KEY = 'finanx:v1';

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
      name: 'Ega Pramudita',
      email: 'ega@finanx.app',
      photo: null,
      created_at: '2024-03-12T09:00:00Z',
      updated_at: '2026-08-16T10:00:00Z',
    },
    transactions: SEED,
    categories: [...SYSTEM_CATEGORIES, ...CUSTOM_CATEGORIES],
    language: 'id',
  };
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class Store {
  constructor(initial, opts = {}) {
    this.data = deepClone(initial);
    this._changed = false;
    this._supabase = opts.supabase || null;
    this._userId = opts.userId || null;
  }

  static load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return new Store(JSON.parse(raw));
    } catch {
      /* fresh start */
    }
    return new Store(seedData());
  }

  static async loadCloud(supabase, authUser) {
    const user = appUserFromAuth(authUser);
    const store = new Store(seedData(), { supabase, userId: user.uid });
    store.data.user = user;

    const uid = user.uid;
    try {
      await supabase.rpc('ensure_system_categories', { uid });
    } catch {
      /* seed via direct insert fallback */
      try {
        const existing = await supabase.from('categories').select('id').eq('user_id', uid);
        if (!existing.data || existing.data.length === 0) {
          await supabase.from('categories').insert(
            SYSTEM_CATEGORIES.map((c) => catToRow(c, uid))
          );
        }
      } catch {
        /* ignore */
      }
    }

    const [catsRes, txRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', uid),
      supabase.from('transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ]);
    const cats = (catsRes.data || []).map(rowToCat);
    const lookup = new Map((catsRes.data || []).map((r) => [r.id, rowToCat(r)]));
    const transactions = (txRes.data || []).map((r) => rowToTx(r, lookup));

    store.data = deepClone({ user, transactions, categories: cats, language: 'id' });
    store._supabase = supabase;
    store._userId = uid;
    store.persist();
    return store;
  }

  persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage unavailable */
    }
  }

  _push(table, rows) {
    if (!this._supabase || !this._userId) return;
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
    const tx = this.data.transactions.find((t) => t.id === id);
    if (!tx) return;
    tx.deleted_at = makeTimestamp();
    tx.updated_at = makeTimestamp();
    this.persist();
    if (this._supabase) this._push('transactions', txToRow(tx, this._userId));
  }

  undoDeleteTransaction(id) {
    const tx = this.data.transactions.find((t) => t.id === id);
    if (!tx) return;
    tx.deleted_at = null;
    tx.updated_at = makeTimestamp();
    this.persist();
    if (this._supabase) this._push('transactions', txToRow(tx, this._userId));
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
    if (this._supabase && this.data.user) {
      this._supabase.from('profiles').upsert(profileRow(this.data.user, lang)).then();
    }
  }

  summaryForMonth(year, monthIndex) {
    const { start, end } = monthRangeISO(year, monthIndex);
    const rows = this.listActiveTransactions().filter((t) => t.date >= start && t.date < end);
    let income = 0;
    let expense = 0;
    const byIncome = {};
    const byExpense = {};
    for (const t of rows) {
      if (t.type === 'income') {
        income += t.amount;
        byIncome[t.category.id] = (byIncome[t.category.id] || 0) + t.amount;
      } else {
        expense += t.amount;
        byExpense[t.category.id] = (byExpense[t.category.id] || 0) + t.amount;
      }
    }
    return { rows, income, expense, balance: income - expense, byIncome, byExpense };
  }

  categoryTotals(map) {
    const cats = this.listActiveCategories();
    const lookup = new Map(cats.map((c) => [c.id, c]));
    return Object.entries(map)
      .map(([id, total]) => ({ category: lookup.get(id), total }))
      .filter((x) => x.category)
      .sort((a, b) => b.total - a.total);
  }

  counterforceMax() {
    const totals = new Map();
    for (const t of this.listActiveTransactions()) {
      const key = t.date.slice(0, 7);
      const cur = totals.get(key) || { income: 0, expense: 0 };
      if (t.type === 'income') cur.income += t.amount;
      else cur.expense += t.amount;
      totals.set(key, cur);
    }
    let max = 1;
    for (const { income, expense } of totals.values()) {
      max = Math.max(max, income, expense);
    }
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