import React, { useRef, useState } from 'react';
import { useApp } from '../App.jsx';
import { filterHistory } from '../lib/ledger.js';
import { makeCSV } from '../lib/csv.js';
import { useDialog } from '../lib/use-dialog.js';

export default function ExportSheet({ filters, summary, onClose }) {
  const { store, t, lang } = useApp();
  const [scope, setScope] = useState('filtered');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const close = () => { if (lock.current) return false; onClose(); return true; };
  const dialog = useDialog(close, 'export');
  const download = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage(''); setError(false);
    let url;
    try {
      const snapshot = await store.exportSnapshot();
      const rows = filterHistory(snapshot.transactions, scope === 'filtered' ? filters : {}, snapshot.categories, lang);
      if (!rows.length) { setMessage(t.exportEmpty); return; }
      const csv = await makeCSV(rows, snapshot.categories, lang);
      store.assertActive();
      url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url; a.download = `finanx-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.append(a); a.click(); a.remove();
      setMessage(t.downloadStarted);
    } catch { setError(true); setMessage(t.exportFailed); }
    finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 60000); lock.current = false; setBusy(false); }
  };
  return <div className="sheet-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}><section ref={dialog} className="sheet" role="dialog" aria-modal="true" aria-labelledby="export-title"><div className="sheet__head"><h2 id="export-title" className="sheet__title" tabIndex="-1">{t.exportTitle}</h2><button className="sheet__close" onClick={close} disabled={busy} aria-label={t.close}>×</button></div><div className="sheet__body">
    <label className="export-option"><input type="radio" name="scope" checked={scope === 'filtered'} onChange={() => setScope('filtered')} disabled={busy} />{t.filteredScope}</label><p>{summary} · {t.allMatching}</p>
    <label className="export-option"><input type="radio" name="scope" checked={scope === 'all'} onChange={() => setScope('all')} disabled={busy} />{t.allScope}</label><p>CSV (.csv)</p><p className="ledger-note">{t.exportNote}</p>
    <button className="btn btn--primary" disabled={busy} onClick={download}>{busy ? t.exporting : t.downloadCSV}</button>{message && <p role={error ? 'alert' : 'status'}>{message}</p>}
  </div></section></div>;
}
