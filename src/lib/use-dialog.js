import { useEffect, useRef } from 'react';

// A history sentinel makes Android/browser Back dismiss one internal sheet view.
export function useDialog(onBack, stage) {
  const ref = useRef(null), back = useRef(onBack);
  const token = useRef(crypto.randomUUID()).current;
  const lifecycle = useRef(0);
  const opener = useRef(document.activeElement);
  back.current = onBack;
  useEffect(() => {
    const generation = ++lifecycle.current;
    const previous = opener.current;
    const saved = window.history.state;
    const mark = () => window.history.pushState({ ...saved, finanxDialog: token }, '', window.location.href);
    if (window.history.state?.finanxDialog !== token) mark();
    const pop = () => {
      if (window.history.state?.finanxDialog === token) return;
      if (back.current() === false) mark();
    };
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); back.current(); }
      if (e.key === 'Tab') {
        const nodes = [...(ref.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]') || [])].filter(n => n.getClientRects().length);
        if (!nodes.length) return;
        const first = nodes[0], last = nodes.at(-1);
        if (!nodes.includes(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const main = document.querySelector('.app');
    const outside = main ? [...main.children].filter(n => !n.contains(ref.current)) : [];
    for (const n of outside) n.inert = true;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('popstate', pop);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('popstate', pop);
      window.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
      for (const n of outside) n.inert = false;
      queueMicrotask(() => {
        if (lifecycle.current !== generation) return; // StrictMode effect replay is not a dismissal.
        if (window.history.state?.finanxDialog === token) window.history.back();
        previous?.focus();
      });
    };
  }, []);
  useEffect(() => { ref.current?.querySelector('[data-autofocus], h2')?.focus(); }, [stage]);
  return ref;
}
