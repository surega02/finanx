import React from 'react';

export default function Stamp({ text, tone, small = false, animated = false, title }) {
  const cls = [
    'stamp',
    tone ? `stamp--${tone}` : '',
    small ? 'stamp--small' : '',
    animated ? 'stamp--stamp-in' : '',
  ].join(' ').trim();

  return (
    <span className={cls} title={title} aria-hidden="true">
      {text}
    </span>
  );
}