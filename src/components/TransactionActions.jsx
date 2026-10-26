import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../lib/icons.jsx';

export default function TransactionActions({ t, label, disabled, onReuse, onEdit, onDelete }) {
  const id = useId();
  const trigger = useRef(null);
  const menu = useRef(null);
  const [position, setPosition] = useState(null);
  const close = (restore = false) => {
    if (restore) trigger.current?.focus();
    setPosition(null);
  };
  const open = (last = false) => {
    const rect = trigger.current.getBoundingClientRect();
    const width = Math.min(208, window.innerWidth - 16);
    setPosition({ left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)), top: rect.bottom + 160 > window.innerHeight ? Math.max(8, rect.top - 152) : rect.bottom + 4, width, last });
  };
  useEffect(() => {
    if (!position) return;
    const items = menu.current.querySelectorAll('[role="menuitem"]');
    items[position.last ? items.length - 1 : 0]?.focus();
    const outside = event => {
      if (!menu.current?.contains(event.target) && !trigger.current?.contains(event.target)) close();
    };
    const dismiss = () => close(true);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [position]);
  const select = action => { close(true); action(); };
  const keyboard = event => {
    const items = [...menu.current.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    else if (event.key === 'Tab') close(true);
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    }
  };
  return <>
    <button ref={trigger} type="button" className="iconbtn tx-actions-trigger" aria-label={`${t.transactionActions}: ${label}`} aria-haspopup="menu" aria-expanded={!!position} aria-controls={position ? id : undefined} disabled={disabled}
      onClick={() => position ? close() : open()} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(event.key === 'ArrowUp'); } }}>
      <Icon name="ellipsis" size={20} />
    </button>
    {position && createPortal(<div ref={menu} id={id} className="tx-actions-menu" role="menu" aria-label={t.transactionActions} style={{ left: position.left, top: position.top, width: position.width }} onKeyDown={keyboard}>
      <button type="button" role="menuitem" onClick={() => select(onReuse)}><Icon name="stamp" size={16} />{t.repeat}</button>
      <button type="button" role="menuitem" onClick={() => select(onEdit)}><Icon name="pencil" size={16} />{t.editThis}</button>
      <button type="button" role="menuitem" className="tx-actions-menu__danger" onClick={() => select(onDelete)}><Icon name="trash" size={16} />{t.deleteThis}</button>
    </div>, document.body)}
  </>;
}
