import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const isCloudEnabled = !!supabase;

const ISO_DAY = (d) =>
  typeof d === 'string' ? d.slice(0, 10) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function appUserFromAuth(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    uid: user.id,
    name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Finanx User',
    email: user.email || '',
    photo: meta.avatar_url || meta.picture || null,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.last_sign_in_at || user.created_at || new Date().toISOString(),
  };
}

export function profileRow(appUser, language) {
  return {
    id: appUser.uid,
    name: appUser.name,
    email: appUser.email,
    photo_url: appUser.photo,
    language,
  };
}

export function txToRow(tx, userId) {
  return {
    id: tx.id,
    user_id: userId,
    type: tx.type,
    amount: tx.amount,
    date: ISO_DAY(tx.date),
    category_id: tx.category.id,
    description: tx.description,
    created_at: tx.created_at,
    updated_at: tx.updated_at,
    deleted_at: tx.deleted_at,
  };
}

export function rowToTx(row, catLookup) {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    date: ISO_DAY(row.date),
    category: catLookup.get(row.category_id) || { id: row.category_id, source: 'user', name: 'Other', nameId: 'Lainnya', icon: 'ellipsis' },
    description: row.description || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

export function catToRow(cat, userId) {
  return {
    id: cat.id,
    user_id: userId,
    type: cat.type,
    name: cat.name,
    name_id: cat.nameId || null,
    icon: cat.icon,
    source: cat.source,
    created_at: cat.created_at || new Date().toISOString(),
    updated_at: cat.updated_at || new Date().toISOString(),
    deleted_at: cat.deleted_at || null,
  };
}

export function rowToCat(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    nameId: row.name_id,
    icon: row.icon,
    source: row.source,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}
