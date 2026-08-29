import React, { useEffect } from 'react';
import { useApp } from '../App.jsx';
import { Icon } from '../lib/icons.jsx';

const TOAST_DURATION_MS = 5000;

export default function Toast() {
  const { toast, dismissToast, t } = useApp();

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(dismissToast, TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast?.key]);

  if (!toast) return null;

  return (
    <div className="toast" role="status" key={toast.key}>
      <span className="toast__message">{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          type="button"
          className="toast__undo"
          onClick={() => {
            dismissToast();
            toast.onAction();
          }}
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        className="toast__close"
        onClick={dismissToast}
        aria-label={t.close}
      >
        <Icon name="plus" size={15} style={{ transform: 'rotate(45deg)' }} />
      </button>
    </div>
  );
}
