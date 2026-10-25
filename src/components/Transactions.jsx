import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../App.jsx';
import { Icon } from '../lib/icons.jsx';
import { money, shortDateNoYear, monthName, monthRangeISO } from '../lib/format.js';
import Stamp from './Stamp.jsx';
import Toast from './Toast.jsx';
import TransactionSheet from './TransactionSheet.jsx';
import ExportSheet from './ExportSheet.jsx';
import { filterHistory } from '../lib/ledger.js';
import { routeURL, safeReturn } from '../lib/navigation.js';

const PAGE_SIZE = 10;
const MONTH_INDEXES = Array.from({ length: 12 }, (_, index) => index);

export default function Transactions() {
  const { store, t, lang, setSheet, pushToast, navigation, navigate, revision } = useApp();
  const [exporting, setExporting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const { type: typeFilter, category: categoryFilter, month: monthValue, year, q: query, page } = navigation;
  const monthFilter = monthValue === 'all' ? 'all' : String(monthValue - 1);
  const change = (patch, pagination = false) => navigate(routeURL('transactions', { ...navigation, ...patch, page: pagination ? patch.page : 1, view: undefined }), true);
  const setTypeFilter = type => change({ type });
  const setCategoryFilter = category => change({ category });
  const setMonthFilter = month => change({ month: month === 'all' ? 'all' : Number(month) + 1 });
  const setQuery = q => change({ q });
  const setPage = page => change({ page }, true);

  const categories = store.state.categories;

  const filtered = useMemo(() => {
    return filterHistory(store.state.transactions, { year, month: monthValue, type: typeFilter, category: categoryFilter, q: query }, categories, lang);
  }, [store, revision, typeFilter, categoryFilter, monthValue, year, query, lang]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDelete = async (tx) => {
    if (busyId) return;
    setBusyId(tx.id);
    try {
      await store.softDeleteTransaction(tx.id);
      pushToast(t.deleted, t.undo, async () => {
        try { await store.undoDeleteTransaction(tx.id); }
        catch { pushToast(t.mutationFailed); }
      });
    } catch { pushToast(t.mutationFailed); }
    finally { setBusyId(null); }
  };

  return (
    <>
      <h1 className="page-title">{t.transactions}</h1>
      <div className="period-controls">{safeReturn(navigation.return) && <button className="btn btn--ghost" onClick={() => navigate(safeReturn(navigation.return))}>{t.backDashboard}</button>}<button className="btn btn--ghost" onClick={() => setExporting(true)}>{t.exportData}</button></div>

      <div className="filters" role="search">
        <label>{t.year}<input key={year} type="number" className="input year-input" aria-label={t.year} min="1" max="9999" defaultValue={year} onBlur={e => { const y = Number(e.target.value); if (Number.isInteger(y) && y >= 1 && y <= 9999) change({ year: y }); else e.target.value = year; }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} /></label>
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
            <option value="all">{t.allMonths}</option>
            {MONTH_INDEXES.map((monthIndex) => (
              <option key={monthIndex} value={monthIndex}>
                {monthName(monthIndex, lang)}
              </option>
            ))}
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
                {store.categoryName(c, lang)}{c.deleted_at ? ` · ${t.historical}` : ''}
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
                  <button type="button" disabled={!!busyId} className="btn btn--ghost btn--sm" onClick={() => setSheet({ mode: 'reuse', tx })}>{t.repeat}</button>
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label={t.editThis}
                    disabled={!!busyId}
                    onClick={() => setSheet({ mode: 'edit', tx })}
                  >
                    <Icon name="pencil" size={16} />
                  </button>
                  <button
                    type="button"
                    className="iconbtn iconbtn--danger"
                    aria-label={t.deleteThis}
                    disabled={!!busyId}
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
      {exporting && <ExportSheet filters={{ year, month: monthValue, type: typeFilter, category: categoryFilter, q: query }} summary={`${year} · ${monthValue === 'all' ? t.allMonths : monthName(monthValue - 1, lang)} · ${t[typeFilter] || t.all} · ${categoryFilter === 'all' ? t.allCategories : store.categoryName(categories.find(c => c.id === categoryFilter), lang)} · ${query}`} onClose={() => setExporting(false)} />}
    </>
  );
}
