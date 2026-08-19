import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon } from '../lib/icons.jsx';
import { money, shortDateNoYear, monthRangeISO } from '../lib/format.js';
import Stamp from './Stamp.jsx';
import Toast from './Toast.jsx';
import TransactionSheet from './TransactionSheet.jsx';

const PAGE_SIZE = 10;

export default function Transactions() {
  const { store, t, lang, setSheet, pushToast, month, currentMonth } = useApp();
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('current');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const categories = store.listActiveCategories();

  useEffect(() => {
    setPage(1);
  }, [typeFilter, categoryFilter, monthFilter, query]);

  const filtered = useMemo(() => {
    let rows = store.listActiveTransactions();

    if (monthFilter === 'current') {
      const { start, end } = monthRangeISO(currentMonth.year, currentMonth.monthIndex);
      rows = rows.filter((x) => x.date >= start && x.date < end);
    }

    if (typeFilter !== 'all') rows = rows.filter((x) => x.type === typeFilter);
    if (categoryFilter !== 'all') rows = rows.filter((x) => x.category.id === categoryFilter);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((x) =>
        (x.description || '').toLowerCase().includes(q) ||
        x.category.name.toLowerCase().includes(q)
      );
    }

    return [...rows].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.created_at.localeCompare(a.created_at)));
  }, [store, typeFilter, categoryFilter, monthFilter, query, currentMonth]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDelete = (tx) => {
    store.softDeleteTransaction(tx.id);
    pushToast(t.deleted, t.undo, () => {
      store.undoDeleteTransaction(tx.id);
    });
  };

  return (
    <>
      <h1 className="page-title">{t.transactions}</h1>

      <div className="filters" role="search">
        <div className="seg" role="group" aria-label={t.typeFilter}>
          <button
            type="button"
            className={`seg__btn ${typeFilter === 'all' ? 'seg__btn--active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            {t.all}
          </button>
          <button
            type="button"
            className={`seg__btn ${typeFilter === 'income' ? 'seg__btn--active' : ''}`}
            onClick={() => setTypeFilter('income')}
          >
            {t.income}
          </button>
          <button
            type="button"
            className={`seg__btn ${typeFilter === 'expense' ? 'seg__btn--active' : ''}`}
            onClick={() => setTypeFilter('expense')}
          >
            {t.expense}
          </button>
        </div>

        <div className="select-wrap">
          <select
            aria-label={t.month}
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="current">{t.thisMonth}</option>
            <option value="all">{t.all}</option>
          </select>
        </div>

        <div className="select-wrap">
          <select
            aria-label={t.categoryFilter}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">{t.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {store.categoryName(c, lang)}
              </option>
            ))}
          </select>
        </div>

        <div className="search">
          <Icon name="list" size={16} />
          <input
            type="search"
            placeholder={t.searchDescription}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t.searchDescription}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <div className="empty__stamp">
            <Icon name="list" size={26} strokeWidth={1.6} />
          </div>
          <h3 className="empty__title">{query || categoryFilter !== 'all' || typeFilter !== 'all' ? t.noResults : t.noTransactions}</h3>
          <p className="empty__text">{t.noTransactionsHint}</p>
          <button type="button" className="btn btn--primary" onClick={() => setSheet({ mode: 'add', tx: null })}>
            <Icon name="stamp" size={16} />
            {t.addTransaction}
          </button>
        </div>
      ) : (
        <div className="txlist">
          <div className="txlist__head">
            <span>{t.date}</span>
            <span>{t.description}</span>
            <span style={{ textAlign: 'right' }}>{t.amount}</span>
            <span style={{ textAlign: 'right' }}>{t.action}</span>
          </div>
          {rows.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div className="txlist__row" key={tx.id}>
                <div className="txlist__date num">{shortDateNoYear(tx.date, lang)}</div>
                <div className="txlist__main">
                  <span className="txlist__icon">
                    <Icon name={tx.category.icon} size={17} strokeWidth={1.7} />
                  </span>
                  <div className="txlist__text">
                    <div className="txlist__name">
                      {store.categoryName(tx.category, lang)}
                      <Stamp text={isIncome ? t.incomeShort : t.expenseShort} tone={isIncome ? 'income' : undefined} small title={t.stamped} />
                    </div>
                    {tx.description && <div className="txlist__desc">{tx.description}</div>}
                  </div>
                </div>
                <div className={`txlist__amount ${isIncome ? 'txlist__amount--income' : 'txlist__amount--expense'} num`}>
                  {money(tx.amount)}
                </div>
                <div className="txlist__actions">
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label={t.editThis}
                    onClick={() => setSheet({ mode: 'edit', tx })}
                  >
                    <Icon name="pencil" size={16} />
                  </button>
                  <button
                    type="button"
                    className="iconbtn iconbtn--danger"
                    aria-label={t.deleteThis}
                    onClick={() => handleDelete(tx)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="pagination">
          <span className="pagination__meta num">
            {t.page} {safePage} {t.of} {pageCount} · {filtered.length} {t.items}
          </span>
          <div className="pagination__btns">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              <Icon name="arrowLeft" size={14} />
              {t.prev}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={safePage >= pageCount}
              onClick={() => setPage(safePage + 1)}
            >
              {t.next}
              <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </div>
      )}

      <Toast />
      <TransactionSheet />
    </>
  );
}