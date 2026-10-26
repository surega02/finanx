import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { money } from '../lib/format.js';
import { validateSettings } from '../lib/ledger.js';

export default function FinancialSettings() {
  const { store, t } = useApp();
  const settings = store.state.financialSettings;
  const [amount, setAmount] = useState(settings.openingBalanceAmount ?? '');
  const [date, setDate] = useState(settings.openingBalanceDate ?? '');
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const configured = settings.openingBalanceAmount !== null;
  const save = async next => {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await store.setFinancialSettings(next);
      setPending(null); setAmount(next.openingBalanceAmount ?? ''); setDate(next.openingBalanceDate ?? ''); setMessage(t.settingsSaved);
    } catch { setError(t.saveFailed); }
    finally { setBusy(false); }
  };
  const submit = e => {
    e.preventDefault(); setError(''); setMessage('');
    const next = { openingBalanceAmount: String(amount), openingBalanceDate: date };
    try { validateSettings(next); } catch { setError(t.settingsInvalid); return; }
    if (configured) setPending(next); else save(next);
  };
  return <section className="plate mt-3"><div className="plate__head"><h2 className="plate__title">{t.financialSettings} · {t.openingBalance}</h2></div><form className="plate__body entry-fields" onSubmit={submit}>
    <p className="ledger-note">{t.openingHelp}</p>
    <label className="field">{t.openingAmount}<input className="input num" aria-label={t.openingAmount} inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} disabled={busy || !!pending} /></label>
    <label className="field">{t.effectiveDate}<input className="input" aria-label={t.effectiveDate} type="date" value={date} onChange={e => setDate(e.target.value)} disabled={busy || !!pending} /></label>
    <p className="ledger-note">{t.openingPreview}</p>
    {pending ? <div role="group" aria-label={t.confirmOpening} className="entry-fields"><p>{pending.openingBalanceAmount === null ? t.confirmReset : t.confirmOpening}</p><p className="num">{money(settings.openingBalanceAmount)} · {settings.openingBalanceDate}{pending.openingBalanceAmount !== null && <> → {money(pending.openingBalanceAmount)} · {pending.openingBalanceDate}</>}</p><div className="form-actions"><button className="btn btn--ghost" type="button" disabled={busy} onClick={() => setPending(null)}>{t.cancel}</button><button className="btn btn--primary" type="button" disabled={busy} onClick={() => save(pending)}>{busy ? t.saving : t.confirm}</button></div></div>
    : <div className="form-actions financial-settings__actions"><button className="btn btn--primary" disabled={busy}>{busy ? t.saving : t.saveOpening}</button>{configured && <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => setPending({ openingBalanceAmount: null, openingBalanceDate: null })}>{t.resetOpening}</button>}</div>}
    {error && <p role="alert" className="error-text">{error}</p>}{message && <p role="status">{message}</p>}
  </form></section>;
}
