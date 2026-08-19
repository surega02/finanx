const PATHS = {
  utensils: (
    <>
      <path d="M7 3v7a2 2 0 0 0 4 0V3" />
      <path d="M9 12v9" />
      <path d="M16 3c-1.5 1.2-2.5 3-2.5 5.5 0 1.8.8 3 2.5 3.5V21" />
    </>
  ),
  coffee: (
    <>
      <path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3c-.6 1 .6 1.6 0 2.6M12 3c-.6 1 .6 1.6 0 2.6" />
    </>
  ),
  car: (
    <>
      <path d="M4 16v-4l2-5h12l2 5v4" />
      <path d="M4 16h16" />
      <path d="M6 19v-3M18 19v-3" />
      <circle cx="7.5" cy="16" r="0.5" />
      <circle cx="16.5" cy="16" r="0.5" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Z" />
      <path d="M10 8h4M10 12h4" />
    </>
  ),
  gamepad: (
    <>
      <path d="M7 7h10a5 5 0 0 1 4.8 6.2l-.8 4a2.5 2.5 0 0 1-4.3 1L15 16H9l-1.7 2.2a2.5 2.5 0 0 1-4.3-1l-.8-4A5 5 0 0 1 7 7Z" />
      <path d="M9.5 10.5v3M8 12h3" />
      <path d="M15.5 11h.01M17.5 13h.01" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20s-7-4.6-9.3-9.2C1.2 7.9 2.9 5 5.8 5c2 0 3.3 1 4.2 2.3C10.9 6 12.2 5 14.2 5c2.9 0 4.6 2.9 3.1 5.8C15 15.4 12 20 12 20Z" />
      <path d="M12 20V9" opacity="0" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  paw: (
    <>
      <circle cx="8" cy="6.5" r="1.6" />
      <circle cx="16" cy="6.5" r="1.6" />
      <circle cx="5" cy="11" r="1.6" />
      <circle cx="19" cy="11" r="1.6" />
      <path d="M12 12c2.5 0 4.8 2 4.8 4.2 0 1.6-1.1 2.8-2.4 2.8-1 0-1.6-.5-2.4-.5s-1.4.5-2.4.5c-1.3 0-2.4-1.2-2.4-2.8C7.2 14 9.5 12 12 12Z" />
    </>
  ),
  controller: (
    <>
      <path d="M8 7h8a6 6 0 0 1 6 6.2l-.4 4a2.6 2.6 0 0 1-4.8.7L15.4 16H8.6l-1.4 1.9a2.6 2.6 0 0 1-4.8-.7l-.4-4A6 6 0 0 1 8 7Z" />
      <path d="M9.5 11v2M8.5 12h2" />
      <path d="M15.5 11h.01M17 12.5h.01" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M4 8h16" />
      <path d="M15 12.5h.01" />
    </>
  ),
  briefcase: (
    <>
      <path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z" />
      <path d="M9 9V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M4 13h16" />
    </>
  ),
  gift: (
    <>
      <path d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" />
      <path d="M12 11v10M4 8h16v3H4z" />
      <path d="M12 8C8 8 6.5 6.6 7.5 4.8 8.7 3 12 5.4 12 8Zm0 0c4 0 5.5-1.4 4.5-3.2C15.3 3 12 5.4 12 8Z" />
    </>
  ),
  present: (
    <>
      <path d="M4 11h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z" />
      <path d="M3 8h18v3H3V8Z" />
      <path d="M12 8v13" />
      <path d="M12 8c-4 0-6-1.5-5-3.4C8 3 12 5 12 8Zm0 0c4 0 6-1.5 5-3.4C16 3 12 5 12 8Z" />
    </>
  ),
  coins: (
    <>
      <circle cx="8.5" cy="8.5" r="5" />
      <path d="M13.5 6a5 5 0 1 1-7 7" />
      <circle cx="15.5" cy="15.5" r="4.5" />
    </>
  ),
  laptop: (
    <>
      <path d="M5 6h14v9H5V6Z" />
      <path d="M3 19h18l-1.5-4h-15L3 19Z" />
    </>
  ),
  ellipsis: (
    <>
      <circle cx="5.5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="18.5" cy="12" r="1" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  check: (
    <>
      <path d="M5 12.5 10 17.5 19 6.5" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  chevronDown: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20l.8-4L17 3.8a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8 19.2 4 20Z" />
      <path d="m14.5 6.5 3 3" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  google: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 3v6h-6" />
    </>
  ),
  language: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 12h17M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
      <path d="M7 7c3.5 1.5 6.5 1.5 10 0M7 17c3.5-1.5 6.5-1.5 10 0" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
      <path d="M10 12h11M17 8l4 4-4 4" />
    </>
  ),
  stamp: (
    <>
      <rect x="7" y="4" width="10" height="6" rx="1" />
      <path d="M9 10v3h6v-3" />
      <path d="M9 16h6v1.5" />
      <path d="M10.5 14v2M13.5 14v2" />
      <path d="M12 17.5V20" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
      <path d="M8.5 14h.01M12 14h.01M15.5 14h.01" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" />
    </>
  ),
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h6l10 10-6 6L4 10V4Z" />
      <circle cx="8.5" cy="8.5" r="1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 21 19H3L12 4Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
};

export function Icon({ name, size = 24, strokeWidth = 1.75, className = '', ...rest }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name] || PATHS.ellipsis}
    </svg>
  );
}