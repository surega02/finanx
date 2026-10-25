import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon } from '../lib/icons.jsx';
import { todayISO, money, shortDate } from '../lib/format.js';
import { filterHistory, normalizeDraft, validDate, transactionAmount } from '../lib/ledger.js';
import { useDialog } from '../lib/use-dialog.js';
import Stamp from './Stamp.jsx';

export default function TransactionSheet() {
  const { sheet } = useApp();
  return sheet ? <Entry key={`${sheet.mode}-${sheet.tx?.id || 'new'}`} /> : null;
}

function Entry() {
  const { store, t, lang, sheet, setSheet } = useApp();
  const activeCategory = tx => store.categoriesFor(tx.type).some(c => c.id === tx.category.id) ? tx.category.id : '';
  const source = sheet.tx;
  const [draft, setDraft] = useState(() => source ? {
    type: source.type, amount: String(source.amount), categoryId: activeCategory(source),
    date: sheet.mode === 'edit' ? source.date : todayISO(), description: source.description || '',
  } : { type: 'expense', amount: '', categoryId: '', date: todayISO(), description: '' });
  const baseline = useRef(normalizeDraft(draft));
  const intent = useRef(sheet.mode === 'edit' ? source.id : crypto.randomUUID());
  const explicitDate = useRef(false);
  const busyRef = useRef(false);
  const successTimer = useRef(null);
  useEffect(() => () => clearTimeout(successTimer.current), []);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('form');
  const [pending, setPending] = useState(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(10);
  const [notice, setNotice] = useState(source && !activeCategory(source) ? t.inactiveCategory : '');
  const dirty = normalizeDraft(draft) !== baseline.current;
  const close = () => {
    if (busyRef.current || saved) return false;
    if (view !== 'form') { setView('form'); return false; }
    if (dirty) { setView('discard'); return false; }
    setSheet(null); return true;
  };
  const dialog = useDialog(close, view);
  const patch = changes => setDraft(d => ({ ...d, ...changes }));
  const cats = store.categoriesFor(draft.type);
  const history = view === 'picker' ? filterHistory(store.state.transactions, { q: query }, store.state.categories, lang) : [];
  const prefill = tx => {
    const categoryId = activeCategory(tx);
    setDraft(d => ({ type: tx.type, amount: String(tx.amount), description: tx.description || '', categoryId, date: explicitDate.current ? d.date : todayISO() }));
    setNotice(categoryId ? '' : t.inactiveCategory);
    setView('form'); setPending(null); setError('');
  };
  const choose = tx => { if (dirty) { setPending(tx); setView('overwrite'); } else prefill(tx); };
  const submit = async e => {
    e.preventDefault();
    if (busyRef.current || saved) return;
    let parsed;
    try { parsed = transactionAmount(draft.amount); } catch { setError(`${t.amount}: ${t.required}`); return; }
    const category = cats.find(c => c.id === draft.categoryId);
    if (!category) { setError(`${t.category}: ${t.required}`); return; }
    if (!validDate(draft.date)) { setError(`${t.date}: ${t.required}`); return; }
    busyRef.current = true; setBusy(true); setError('');
    try {
      await store.saveTransaction({ ...draft, amount: parsed, category }, intent.current, sheet.mode === 'edit');
      setSaved(true);
      successTimer.current = setTimeout(() => setSheet(null), sheet.mode === 'edit' ? 250 : 650);
    } catch (e) { setError(e.message === 'intentConflict' ? t.intentConflict : t.saveFailed); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return <div className="sheet-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
    <div className="sheet sheet--bottom" role="dialog" aria-modal="true" aria-labelledby="tx-sheet-title" ref={dialog}>
      <div className="sheet__head"><h2 id="tx-sheet-title" className="sheet__title" tabIndex="-1">{view === 'picker' ? t.historyPicker : sheet.mode === 'edit' ? t.editThis : t.addTransaction}</h2><button className="sheet__close" onClick={close} disabled={busy || saved} aria-label={view === 'picker' ? t.prev : t.close}><Icon name={view === 'picker' ? 'arrowLeft' : 'plus'} size={18} style={view === 'picker' ? undefined : { transform: 'rotate(45deg)' }} /></button></div>
      {view === 'discard' || view === 'overwrite' ? <div className="sheet__body"><p>{view === 'discard' ? t.discard : t.overwrite}</p><button className="btn btn--ghost" data-autofocus onClick={() => setView('form')}>{view === 'discard' ? t.keepEditing : t.keepDraft}</button><button className="btn btn--primary" onClick={() => view === 'discard' ? setSheet(null) : prefill(pending)}>{view === 'discard' ? t.discardAction : t.useHistoryData}</button></div>
      : view === 'picker' ? <div className="sheet__body"><button className="btn btn--ghost" onClick={() => setView('form')}>{t.prev}</button><input className="input" data-autofocus type="search" aria-label={t.historySearch} placeholder={t.historySearch} value={query} onChange={e => { setQuery(e.target.value); setLimit(10); }} />{!history.length && <p>{t.noResults}</p>}{history.slice(0, limit).map(tx => <button className="history-choice" key={tx.id} onClick={() => choose(tx)}><span>{store.categoryName(tx.category, lang)} · {shortDate(tx.date, lang)}</span><strong className="num">{money(tx.amount)}</strong><span>{tx.description}</span></button>)}{history.length > limit && <button className="btn btn--ghost" onClick={() => setLimit(n => n + 10)}>{t.loadMore}</button>}</div>
      : <form className="sheet__body" onSubmit={submit}>
        <fieldset disabled={busy || saved} className="entry-fields">
          {sheet.mode !== 'edit' && <button className="btn btn--ghost" type="button" onClick={() => setView('picker')}>{t.useHistory}</button>}
          <div className="type-toggle" role="group" aria-label={t.type}>{['income', 'expense'].map(type => <button key={type} type="button" className={`type-toggle__btn type-toggle__btn--${type} ${draft.type === type ? 'active' : ''}`} onClick={() => patch({ type, categoryId: '' })} aria-pressed={draft.type === type}><Icon name={type === 'income' ? 'wallet' : 'receipt'} size={18} />{t[type]}</button>)}</div>
          <div className="field"><label className="field__label" htmlFor="tx-amount">{t.amount} *</label><input id="tx-amount" className="input input--ledger num" type="text" inputMode="decimal" value={draft.amount} onChange={e => patch({ amount: e.target.value })} placeholder="50000" /></div>
          <div className="field"><span className="field__label">{t.category} *</span><div className="catgrid">{cats.map(c => <button type="button" key={c.id} className={`catgrid__btn ${draft.categoryId === c.id ? 'catgrid__btn--active' : ''}`} onClick={() => patch({ categoryId: c.id })} aria-pressed={draft.categoryId === c.id}><Icon name={c.icon} size={20} /><span>{store.categoryName(c, lang)}</span></button>)}</div></div>
          {notice && <p className="ledger-note">{notice}</p>}
          <div className="field"><label className="field__label" htmlFor="tx-date">{t.date} *</label><input id="tx-date" className="input" type="date" value={draft.date} onChange={e => { explicitDate.current = true; patch({ date: e.target.value }); }} /></div>
          <div className="field"><label className="field__label" htmlFor="tx-desc">{t.descriptionOptional}</label><textarea id="tx-desc" className="input" rows="2" value={draft.description} onChange={e => patch({ description: e.target.value })} /></div>
        </fieldset>
        {error && <p role="alert" className="error-text">{error}</p>}
        <div className="form-actions">{saved ? <Stamp text={draft.type === 'income' ? 'TERIMA' : 'LUNAS'} animated /> : <><button type="button" className="btn btn--ghost" disabled={busy} onClick={close}>{t.cancel}</button><button className="btn btn--primary" type="submit" disabled={busy}>{busy ? t.saving : sheet.mode === 'edit' ? t.saveChanges : t.stampTransaction}</button></>}</div>
      </form>}
    </div>
  </div>;
}
