import React from 'react';
import { useApp } from '../App.jsx';
import { Icon } from '../lib/icons.jsx';
import { money, moneyDelta, monthLabel } from '../lib/format.js';
import Stamp from './Stamp.jsx';
import Toast from './Toast.jsx';
import TransactionSheet from './TransactionSheet.jsx';
import { insights, percent, ratio } from '../lib/ledger.js';
import { routeURL } from '../lib/navigation.js';

function Counterforce({ income, expense }) {
  const { t, store } = useApp();
  const max = store.counterforceMax();
  const iw = Math.min(100, ratio(income, max) * 100);
  const ew = Math.min(100, ratio(expense, max) * 100);

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
          <span className="cf__value cf__value--income num">{money(income)}</span>
        </div>
        <div className="cf__row">
          <span className="cf__label">{t.expense}</span>
          <div className="cf__track" role="img" aria-label={`${t.expense}: ${money(expense)}`}>
            <div className="cf__grid" aria-hidden="true" />
            <div className="cf__bar cf__bar--expense" style={{ '--w': Math.max(ew, expense > 0 ? 2 : 0) / 100 }} />
          </div>
          <span className="cf__value cf__value--expense num">{money(expense)}</span>
        </div>
        <div className="cf__ticks" aria-hidden="true">
          <div className="cf__ticks__ruler">
            <span className="num">{money(0, { compact: true })}</span>
            <span className="num">{money(max / 2n, { compact: true })}</span>
            <span className="num">{money(max, { compact: true })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Breakdown({ type, totals, total, prior, future, drill }) {
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
        <span className="breakdown__total num">{money(total)}</span>
      </div>
      <div>
        {totals.map(({ category, total: catTotal }) => {
          const pct = ratio(catTotal, total) * 100;
          return (
            <div className="breakdown__row" key={category.id}>
              <span className="breakdown__icon">
                <Icon name={category.icon} size={16} strokeWidth={1.7} />
              </span>
              <span className="breakdown__name">
                <button className="ledger-link" onClick={() => drill(type, category.id)}>{store.categoryName(category, lang)}</button>
                <span className="breakdown__track">
                  <span className={`breakdown__bar ${colorCls}`} style={{ '--w': pct / 100 }} />
                </span>
              </span>
              <span className="breakdown__amount num">{money(catTotal)}<small className="ledger-note">{t.change}: {moneyDelta(catTotal - (prior[category.id] || 0n))} {!future && percent(catTotal, prior[category.id] || 0n)}</small></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { store, revision, month, setMonth, currentMonth, t, lang, setSheet, navigate } = useApp();
  const { year, monthIndex } = month;
  const data = React.useMemo(() => insights(store.state.transactions, year, monthIndex, store.state.financialSettings), [store, revision, year, monthIndex]);
  const summary = data.selected;
  const [comparisonOpen, setComparisonOpen] = React.useState(false);
  const drill = (type, category) => navigate(routeURL('transactions', { year, month: monthIndex + 1, type, category, return: routeURL('dashboard', { year, month: monthIndex + 1 }) }));

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

      <div className="period-controls">
        <label>{t.month}<select aria-label={t.period} value={monthIndex} onChange={e => setMonth({ year, monthIndex: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, m) => <option key={m} value={m}>{monthLabel(year, m, lang)}</option>)}</select></label>
        <label>{t.year}<input key={year} aria-label={t.year} type="number" min="1" max="9999" defaultValue={year} onBlur={e => { const y = Number(e.target.value); if (Number.isInteger(y) && y >= 1 && y <= 9999) setMonth({ year: y, monthIndex }); else e.target.value = year; }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} /></label>
      </div>
      {(data.current || data.future) && <p className="ledger-note">{data.future ? t.futurePeriod : t.provisional}</p>}

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
          <p className="ledger-note">{t.change} {t.compared.toLowerCase()} {monthLabel(data.previous.year, data.previous.monthIndex, lang)}: {moneyDelta(summary.income - data.prior.income)} {!data.future && percent(summary.income, data.prior.income)}</p>
          <button className="ledger-link" onClick={() => drill('income')}>{t.viewTransactions}</button>
        </div>
        <div className="summary__cell">
          <span className="summary__label">
            <Icon name="receipt" size={15} />
            {t.expense}
          </span>
          <div className="summary__value summary__value--expense num">{money(summary.expense)}</div>
          <div className="summary__sub">{t.expenseTotal}</div>
          <p className="ledger-note">{t.change} {t.compared.toLowerCase()} {monthLabel(data.previous.year, data.previous.monthIndex, lang)}: {moneyDelta(summary.expense - data.prior.expense)} {!data.future && percent(summary.expense, data.prior.expense)}</p>
          <button className="ledger-link" onClick={() => drill('expense')}>{t.viewTransactions}</button>
        </div>
        <div className="summary__cell summary__cell--saldo">
          <span className="summary__label">{t.monthlyBalance}</span>
          <div className="summary__value num">{money(summary.balance)}</div>
          <div className="summary__sub">{t.saldo}</div>
        </div>
      </div>

      <Counterforce income={summary.income} expense={summary.expense} />
      <Trend data={data} />
      {data.aligned && <details className="plate"><summary>{t.aligned}</summary><div className="plate__body"><p>{data.aligned.start} – {data.aligned.end} / {data.aligned.previousStart} – {data.aligned.previousEnd}</p>{data.aligned.shorter && <p>{t.shorterPeriod}</p>}{['income', 'expense'].map(type => <p key={type}>{t[type]}: {money(data.aligned.selected[type])} / {money(data.aligned.previous[type])} · {t.change}: {moneyDelta(data.aligned.selected[type] - data.aligned.previous[type])} {percent(data.aligned.selected[type], data.aligned.previous[type])}</p>)}</div></details>}
      <details className="plate" onToggle={e => setComparisonOpen(e.currentTarget.open)}><summary>{t.comparisonDetail} · {t.compared} {monthLabel(data.previous.year, data.previous.monthIndex, lang)}</summary>{comparisonOpen && <div className="plate__body">{['income', 'expense'].map(type => {
        const key = type === 'income' ? 'byIncome' : 'byExpense';
        return store.categoryTotals(Object.fromEntries([...new Set([...Object.keys(summary[key]), ...Object.keys(data.prior[key])])].map(id => [id, summary[key][id] || 0n]))).map(({ category, total }) => <p key={`${type}-${category.id}`}>{store.categoryName(category, lang)} · {t[type]}: {money(total)} / {money(data.prior[key][category.id] || 0n)} · {t.change}: {moneyDelta(total - (data.prior[key][category.id] || 0n))} {!data.future && percent(total, data.prior[key][category.id] || 0n)}</p>);
      })}</div>}</details>

      <div className="breakdown">
        <Breakdown type="income" totals={incomeTotals} total={summary.income} prior={data.prior.byIncome} future={data.future} drill={drill} />
        <Breakdown type="expense" totals={expenseTotals} total={summary.expense} prior={data.prior.byExpense} future={data.future} drill={drill} />
      </div>
      <section className="plate"><div className="plate__head"><h2 className="plate__title">{data.configured ? t.cumulative : t.accumulated}</h2></div><div className="plate__body"><p className="num">{data.cumulative === null ? t.unavailable : money(data.cumulative)}</p><p className="ledger-note">{data.configured ? `${t.since} ${store.state.financialSettings.openingBalanceDate} · ${t.recordedBalance}` : t.accumulatedNote}</p></div></section>

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

function Trend({ data }) {
  const { t, lang } = useApp();
  const max = data.trend.reduce((max, p) => [max, p.income, p.expense].reduce((a, b) => a > b ? a : b), 1n);
  return <section className="plate trend"><div className="plate__head"><h2 className="plate__title">{t.trend}</h2></div><div className="plate__body">
    <svg viewBox="0 0 600 200" role="img" aria-label={t.trend}>
      {[20, 90, 160].map(y => <line key={y} x1="30" x2="570" y1={y} y2={y} stroke="var(--rule-soft)" />)}
      {['income', 'expense'].map(type => <g key={type} stroke={type === 'income' ? 'var(--ink)' : 'var(--slate)'} fill="none" strokeWidth="2">{data.trend.map((p, i) => {
        const x = 30 + i * 108, y = 160 - ratio(p[type], max) * 140;
        return <g key={i}>{i > 0 && <line x1={x - 108} y1={160 - ratio(data.trend[i - 1][type], max) * 140} x2={x} y2={y} strokeDasharray={p.future ? '5 4' : undefined} />}<circle cx={x} cy={y} r="3" /></g>;
      })}</g>)}
      {data.trend.map((p, i) => <text key={i} x={30 + i * 108} y="188" textAnchor="middle" fill="var(--ink-soft)" fontSize="12">{String(p.monthIndex + 1).padStart(2, '0')}/{String(p.year).slice(-2)}</text>)}
    </svg>
    <p className="ledger-note">{t.income} / {t.expense} · {t.trendNote}</p>
    <dl className="trend-values">{data.trend.map(p => <div key={`${p.year}-${p.monthIndex}`}><dt>{monthLabel(p.year, p.monthIndex, lang)}{p.future ? ` · ${t.futurePeriod}` : ''}</dt><dd className="num">{t.income}: {money(p.income)} · {t.expense}: {money(p.expense)}{!p.rows.length ? ` · ${t.noRecords}` : ''}</dd></div>)}</dl>
  </div></section>;
}
