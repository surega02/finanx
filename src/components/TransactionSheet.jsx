import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon } from '../lib/icons.jsx';
import { todayISO } from '../lib/format.js';
import Stamp from './Stamp.jsx';

export default function TransactionSheet() {
  const { store, t, lang, sheet, setSheet } = useApp();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [stamping, setStamping] = useState(false);
  const [justStamped, setJustStamped] = useState(false);
  const firstField = useRef(null);

  const open = !!sheet;

  useEffect(() => {
    if (open) {
      if (sheet.mode === 'edit' && sheet.tx) {
        setType(sheet.tx.type);
        setAmount(String(sheet.tx.amount));
        setCategoryId(sheet.tx.category.id);
        setDate(sheet.tx.date);
        setDescription(sheet.tx.description || '');
      } else {
        setType('expense');
        setAmount('');
        setCategoryId('');
        setDate(todayISO());
        setDescription('');
      }
      setError('');
      setStamping(false);
      setJustStamped(false);
    }
  }, [open, sheet]);

  useEffect(() => {
    if (open && firstField.current) {
      setTimeout(() => firstField.current.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const onKey = (e) => {
        if (e.key === 'Escape') setSheet(null);
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [open, setSheet]);

  const cats = store.categoriesFor(type);

  useEffect(() => {
    if (categoryId && !cats.some((c) => c.id === categoryId)) {
      setCategoryId('');
    }
  }, [type, cats, categoryId]);

  if (!open) return null;

  const parsedAmount = Number(String(amount).replace(/[^0-9.]/g, ''));
  const today = todayISO();
  const maxDate = new Date().toISOString().slice(0, 10);

  const submit = () => {
    if (!parsedAmount || parsedAmount <= 0) {
      setError(t.amount);
      return;
    }
    if (!categoryId) {
      setError(t.category);
      return;
    }
    if (!date || date > maxDate) {
      setError(t.date);
      return;
    }
    const category = cats.find((c) => c.id === categoryId);

    if (sheet.mode === 'edit' && sheet.tx) {
      store.updateTransaction(sheet.tx.id, {
        type,
        amount: Math.round(parsedAmount),
        date,
        description,
        category,
      });
    } else {
      setStamping(true);
      store.addTransaction({
        type,
        amount: Math.round(parsedAmount),
        date,
        description,
        category,
      });
    }
    setJustStamped(true);
    setTimeout(() => {
      setSheet(null);
    }, sheet.mode === 'edit' ? 250 : 650);
  };

  return (
    <div
      className="sheet-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setSheet(null);
      }}
    >
      <div
        className={`sheet ${sheet.mode === 'edit' ? '' : 'sheet--bottom'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-sheet-title"
      >
        <div className="sheet__head">
          <h2 id="tx-sheet-title" className="sheet__title">
            {sheet.mode === 'edit' ? t.editThis : t.addTransaction}
          </h2>
          <button type="button" className="sheet__close" onClick={() => setSheet(null)} aria-label={t.cancel}>
            <Icon name="plus" size={18} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <div className="sheet__body">
          <div className="type-toggle" role="group" aria-label={t.type}>
            <button
              type="button"
              className={`type-toggle__btn type-toggle__btn--income ${type === 'income' ? 'active' : ''}`}
              onClick={() => { setType('income'); setCategoryId(''); }}
              aria-pressed={type === 'income'}
            >
              <Icon name="wallet" size={18} />
              {t.income}
            </button>
            <button
              type="button"
              className={`type-toggle__btn type-toggle__btn--expense ${type === 'expense' ? 'active' : ''}`}
              onClick={() => { setType('expense'); setCategoryId(''); }}
              aria-pressed={type === 'expense'}
            >
              <Icon name="receipt" size={18} />
              {t.expense}
            </button>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="tx-amount">{t.amount} *</label>
            <input
              id="tx-amount"
              ref={firstField}
              className="input input--ledger num caret-ink"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50.000"
            />
          </div>

          <div className="field">
            <span className="field__label">{t.category} *</span>
            <div className="catgrid">
              {cats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`catgrid__btn ${categoryId === c.id ? 'catgrid__btn--active' : ''}`}
                  onClick={() => setCategoryId(c.id)}
                  aria-pressed={categoryId === c.id}
                >
                  <Icon name={c.icon} size={20} strokeWidth={1.7} />
                  <span>{store.categoryName(c, lang)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="tx-date">{t.date} *</label>
            <input
              id="tx-date"
              className="input caret-ink"
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="tx-desc">{t.descriptionOptional}</label>
            <textarea
              id="tx-desc"
              className="input caret-ink"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.description}
            />
          </div>

          {error && (
            <p className="error-text" role="alert">
              {error === t.amount ? `${t.amount} ${t.required}` : error === t.category ? `${t.category} ${t.required}` : error === t.date ? t.required : error}
            </p>
          )}

          <div className="form-actions">
            {stamping ? (
              <Stamp text={type === 'income' ? 'TERIMA' : 'LUNAS'} tone={type === 'income' ? 'income' : 'expense'} animated />
            ) : (
              <>
                <button type="button" className="btn btn--ghost" onClick={() => setSheet(null)}>
                  {t.cancel}
                </button>
                <button type="button" className="btn btn--primary" onClick={submit}>
                  <Icon name="stamp" size={16} />
                  {sheet.mode === 'edit' ? t.saveChanges : t.stampTransaction}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}