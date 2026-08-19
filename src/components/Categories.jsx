import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon } from '../lib/icons.jsx';
import { CATEGORY_ICONS } from '../lib/store.js';
import Toast from './Toast.jsx';

export default function Categories() {
  const { store, t, lang, pushToast } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [icon, setIcon] = useState('tag');
  const [error, setError] = useState('');
  const nameField = useRef(null);

  const incomeCats = store.categoriesFor('income');
  const expenseCats = store.categoriesFor('expense');

  useEffect(() => {
    if (open) setTimeout(() => nameField.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    if (open) {
      const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [open]);

  const submit = () => {
    const clean = name.trim();
    if (!clean) {
      setError(t.categoryName);
      return;
    }
    if (store.categoryNameExists(clean, type)) {
      setError(t.nameExists);
      return;
    }
    store.addCategory({ name: clean, type, icon });
    setOpen(false);
    setName('');
    setIcon('tag');
    setError('');
  };

  const removeCategory = (cat) => {
    if (!window.confirm(t.confirmDeleteCategory)) return;
    store.softDeleteCategory(cat.id);
    pushToast(t.categoryDeleted);
  };

  return (
    <>
      <div className="section-head">
        <h1 className="section-head__title">{t.categories}</h1>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setOpen(true)}>
          <Icon name="plus" size={15} />
          {t.addCategory}
        </button>
      </div>

      <div className="catmanage">
        <div className="catmanage__group">
          <div className="catmanage__head">
            <h2 className="catmanage__title">
              <Icon name="wallet" size={16} />
              {t.income}
            </h2>
            <span className="catmanage__count num">{incomeCats.length}</span>
          </div>
          <div>
            {incomeCats.length === 0 && <div className="catmanage__empty">{t.noCategories}</div>}
            {incomeCats.map((cat) => (
              <CategoryRow key={cat.id} cat={cat} onDelete={removeCategory} />
            ))}
          </div>
        </div>

        <div className="catmanage__group">
          <div className="catmanage__head">
            <h2 className="catmanage__title">
              <Icon name="receipt" size={16} />
              {t.expense}
            </h2>
            <span className="catmanage__count num">{expenseCats.length}</span>
          </div>
          <div>
            {expenseCats.length === 0 && <div className="catmanage__empty">{t.noCategories}</div>}
            {expenseCats.map((cat) => (
              <CategoryRow key={cat.id} cat={cat} onDelete={removeCategory} />
            ))}
          </div>
        </div>
      </div>

      {open && (
        <div
          className="sheet-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="cat-sheet-title">
            <div className="sheet__head">
              <h2 id="cat-sheet-title" className="sheet__title">{t.newCategory}</h2>
              <button type="button" className="sheet__close" onClick={() => setOpen(false)} aria-label={t.cancel}>
                <Icon name="plus" size={18} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <div className="sheet__body">
              <div className="type-toggle" role="group" aria-label={t.type}>
                <button
                  type="button"
                  className={`type-toggle__btn type-toggle__btn--income ${type === 'income' ? 'active' : ''}`}
                  onClick={() => { setType('income'); setError(''); }}
                  aria-pressed={type === 'income'}
                >
                  <Icon name="wallet" size={18} />
                  {t.income}
                </button>
                <button
                  type="button"
                  className={`type-toggle__btn type-toggle__btn--expense ${type === 'expense' ? 'active' : ''}`}
                  onClick={() => { setType('expense'); setError(''); }}
                  aria-pressed={type === 'expense'}
                >
                  <Icon name="receipt" size={18} />
                  {t.expense}
                </button>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="cat-name">{t.categoryName} *</label>
                <input
                  id="cat-name"
                  ref={nameField}
                  className="input caret-ink"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder={type === 'income' ? t.income : t.expense}
                />
                {error && <p className="error-text" role="alert">{error}</p>}
              </div>

              <div className="field">
                <span className="field__label">{t.categoryIcon}</span>
                <div className="catgrid">
                  {CATEGORY_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      className={`catgrid__btn ${icon === ic ? 'catgrid__btn--active' : ''}`}
                      onClick={() => setIcon(ic)}
                      aria-pressed={icon === ic}
                    >
                      <Icon name={ic} size={20} strokeWidth={1.7} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
                  {t.cancel}
                </button>
                <button type="button" className="btn btn--primary" onClick={submit}>
                  <Icon name="stamp" size={16} />
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast />
    </>
  );
}

function CategoryRow({ cat, onDelete }) {
  const { store, t, lang } = useApp();
  const isUser = cat.source === 'user';
  return (
    <div className="catmanage__row">
      <span className="catmanage__icon">
        <Icon name={cat.icon} size={16} strokeWidth={1.7} />
      </span>
      <span className="catmanage__name">
        {store.categoryName(cat, lang)}
        <span className={`catmanage__tag ${isUser ? 'catmanage__tag--user' : ''}`}>
          {isUser ? t.customCategory : t.systemCategory}
        </span>
      </span>
      {isUser ? (
        <button
          type="button"
          className="iconbtn iconbtn--danger"
          onClick={() => onDelete(cat)}
          aria-label={`${t.deleteThis}: ${store.categoryName(cat, lang)}`}
        >
          <Icon name="trash" size={15} />
        </button>
      ) : (
        <span aria-hidden="true" style={{ width: 30 }} />
      )}
    </div>
  );
}