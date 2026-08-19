import React from 'react';
import { useApp } from '../App.jsx';
import { Icon } from '../lib/icons.jsx';
import { money, monthLabel, shortDate } from '../lib/format.js';
import Stamp from './Stamp.jsx';
import Toast from './Toast.jsx';
import TransactionSheet from './TransactionSheet.jsx';

function Counterforce({ income, expense }) {
  const { t, store } = useApp();
  const max = store.counterforceMax();
  const iw = Math.min(100, (income / max) * 100);
  const ew = Math.min(100, (expense / max) * 100);

  return (
    <div className="counterforce">
      <div className="counterforce__head">
        <h2 className="counterforce__title">{t.incomeVsExpense}</h2>
        <span className="counterforce__scale">{t.currency}</span>
      </div>
      <div className="cf">
        <div className="cf__row">
          <span className="cf__label">{t.income}</span>
          <div className="cf__track" role="img" aria-label={`${t.income}: ${money(income)}`}>
            <div className="cf__grid" aria-hidden="true" />
            <div className="cf__bar cf__bar--income" style={{ '--w': Math.max(iw, income > 0 ? 2 : 0) / 100 }} />
          </div>
          <span className="cf__value cf__value--income num">{money(income, { compact: true })}</span>
        </div>
        <div className="cf__row">
          <span className="cf__label">{t.expense}</span>
          <div className="cf__track" role="img" aria-label={`${t.expense}: ${money(expense)}`}>
            <div className="cf__grid" aria-hidden="true" />
            <div className="cf__bar cf__bar--expense" style={{ '--w': Math.max(ew, expense > 0 ? 2 : 0) / 100 }} />
          </div>
          <span className="cf__value cf__value--expense num">{money(expense, { compact: true })}</span>
        </div>
        <div className="cf__ticks" aria-hidden="true">
          <div className="cf__ticks__ruler">
            <span className="num">{money(0, { compact: true })}</span>
            <span className="num">{money(max * 0.5, { compact: true })}</span>
            <span className="num">{money(max, { compact: true })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Breakdown({ type, totals, total }) {
  const { t, store, lang } = useApp();
  const label = type === 'income' ? t.incomeBreakdown : t.expenseBreakdown;
  const colorCls = type === 'income' ? '' : 'breakdown__bar--expense';

  if (!totals.length) {
    return (
      <div className="breakdown__list">
        <div className="breakdown__head">
          <h3 className="breakdown__title">{label}</h3>
        </div>
        <div className="breakdown__empty">{t.noTransactions}</div>
      </div>
    );
  }

  return (
    <div className="breakdown__list">
      <div className="breakdown__head">
        <h3 className="breakdown__title">{label}</h3>
        <span className="breakdown__total num">{money(total, { compact: true })}</span>
      </div>
      <div>
        {totals.map(({ category, total: catTotal }) => {
          const pct = total > 0 ? (catTotal / total) * 100 : 0;
          return (
            <div className="breakdown__row" key={category.id}>
              <span className="breakdown__icon">
                <Icon name={category.icon} size={16} strokeWidth={1.7} />
              </span>
              <span className="breakdown__name">
                <span>{store.categoryName(category, lang)}</span>
                <span className="breakdown__track">
                  <span className={`breakdown__bar ${colorCls}`} style={{ '--w': pct / 100 }} />
                </span>
              </span>
              <span className="breakdown__amount num">{money(catTotal, { compact: true })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { store, month, setMonth, currentMonth, t, lang, setSheet } = useApp();
  const { year, monthIndex } = month;
  const summary = store.summaryForMonth(year, monthIndex);

  const incomeTotals = store.categoryTotals(summary.byIncome);
  const expenseTotals = store.categoryTotals(summary.byExpense);

  const isCurrent = year === currentMonth.year && monthIndex === currentMonth.monthIndex;

  const goMonth = (delta) => {
    let y = year;
    let m = monthIndex + delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth({ year: y, monthIndex: m });
  };

  return (
    <>
      <div className="monthnav">
        <span className="monthnav__chips">
          <button type="button" className="monthnav__btn" onClick={() => goMonth(-1)} aria-label={t.prev}>
            <Icon name="arrowLeft" size={18} />
          </button>
        </span>
        <h1 className="monthnav__label">{monthLabel(year, monthIndex, lang)}</h1>
        <span className="monthnav__chips">
          <button type="button" className="monthnav__today" onClick={() => setMonth(currentMonth)}>
            {t.today}
          </button>
          <button type="button" className="monthnav__btn" onClick={() => goMonth(1)} aria-label={t.next}>
            <Icon name="arrowRight" size={18} />
          </button>
        </span>
      </div>

      {isCurrent && (
        <button type="button" className="btn btn--primary" style={{ marginBottom: 24 }} onClick={() => setSheet({ mode: 'add', tx: null })}>
          <Icon name="stamp" size={16} />
          {t.stampTransaction}
        </button>
      )}

      <div className="summary">
        <div className="summary__cell">
          <span className="summary__label">
            <Icon name="wallet" size={15} />
            {t.income}
          </span>
          <div className="summary__value summary__value--income num">{money(summary.income)}</div>
          <div className="summary__sub">{t.incomeTotal}</div>
        </div>
        <div className="summary__cell">
          <span className="summary__label">
            <Icon name="receipt" size={15} />
            {t.expense}
          </span>
          <div className="summary__value summary__value--expense num">{money(summary.expense)}</div>
          <div className="summary__sub">{t.expenseTotal}</div>
        </div>
        <div className="summary__cell summary__cell--saldo">
          <span className="summary__label">{t.balance}</span>
          <div className="summary__value num">{money(summary.balance)}</div>
          <div className="summary__sub">{t.saldo}</div>
        </div>
      </div>

      <Counterforce income={summary.income} expense={summary.expense} />

      <div className="breakdown">
        <Breakdown type="income" totals={incomeTotals} total={summary.income} />
        <Breakdown type="expense" totals={expenseTotals} total={summary.expense} />
      </div>

      {summary.rows.length === 0 && (
        <div className="empty">
          <div className="empty__stamp">
            <Icon name="stamp" size={26} strokeWidth={1.6} />
          </div>
          <h3 className="empty__title">{t.noTransactions}</h3>
          <p className="empty__text">{t.noTransactionsHint}</p>
          <button type="button" className="btn btn--primary" onClick={() => setSheet({ mode: 'add', tx: null })}>
            <Icon name="stamp" size={16} />
            {t.addTransaction}
          </button>
        </div>
      )}

      <Toast />
      <TransactionSheet />
    </>
  );
}