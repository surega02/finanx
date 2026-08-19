import React from 'react';
import { useApp } from '../App.jsx';

export default function Toast() {
  const { toast, dismissToast } = useApp();
  if (!toast) return null;

  return (
    <div className="toast" role="status" key={toast.key}>
      <span>{toast.message}</span>
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
    </div>
  );
}