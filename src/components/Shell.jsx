import React from 'react';
import { Icon } from '../lib/icons.jsx';
import { useApp } from '../App.jsx';
import logo from '../assets/logo.png';
import Dashboard from './Dashboard.jsx';
import Transactions from './Transactions.jsx';
import Categories from './Categories.jsx';
import Profile from './Profile.jsx';

function Mark() {
  return (
    <div className="mark">
      <img className="mark__logo" src={logo} alt="Finanx" />
    </div>
  );
}

const NAV = [
  { id: 'dashboard', icon: 'home' },
  { id: 'transactions', icon: 'list' },
  { id: 'categories', icon: 'tag' },
  { id: 'profile', icon: 'user' },
];

export function LangToggle() {
  const { lang, setLang, t } = useApp();
  return (
    <div className="lang-toggle">
      <span>{t.language}</span>
      <span className="lang-toggle__switch">
        {['id', 'en'].map((l) => (
          <button
            key={l}
            type="button"
            className={`lang-toggle__opt ${lang === l ? 'lang-toggle__opt--active' : ''}`}
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
          >
            {l === 'id' ? 'ID' : 'EN'}
          </button>
        ))}
      </span>
    </div>
  );
}

function ShellView() {
  const { view } = useApp();
  if (view === 'transactions') return <Transactions />;
  if (view === 'categories') return <Categories />;
  if (view === 'profile') return <Profile />;
  return <Dashboard />;
}

export default function Shell() {
  const { user, view, setView, t, setSheet } = useApp();

  const navLabels = {
    dashboard: t.dashboard,
    transactions: t.transactions,
    categories: t.categories,
    profile: t.profile,
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <Mark />
        <nav className="nav" aria-label="Primary">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`nav__item ${view === n.id ? 'nav__item--active' : ''}`}
              onClick={() => setView(n.id)}
              aria-current={view === n.id ? 'page' : undefined}
            >
              <Icon name={n.icon} size={18} strokeWidth={1.75} />
              {navLabels[n.id]}
            </button>
          ))}
        </nav>
        <div className="sidebar__foot">
          <LangToggle />
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <Mark />
          <div className="topbar__right">
            <button
              type="button"
              className="avatar-btn"
              onClick={() => setView('profile')}
              aria-label={t.profile}
            >
              {user?.photo ? (
                <img src={user.photo} alt="" />
              ) : (
                <Icon name="user" size={18} />
              )}
            </button>
          </div>
        </div>

        <main className="surface" id="main">
          <div className="surface__inner">
            <div className="demo-banner" role="note">
              <Icon name="stamp" size={15} />
              <span>{t.demoBanner}</span>
            </div>
            <ShellView />
          </div>
        </main>
      </div>

      <nav className="tabbar" aria-label={t.primaryNav}>
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`tabbar__item ${view === n.id ? 'tabbar__item--active' : ''}`}
            onClick={() => setView(n.id)}
            aria-current={view === n.id ? 'page' : undefined}
          >
            <Icon name={n.icon} size={22} strokeWidth={1.8} />
            <span>{navLabels[n.id]}</span>
          </button>
        ))}
      </nav>

      {view !== 'categories' && view !== 'profile' && (
        <button
          type="button"
          className="fab"
          onClick={() => setSheet({ mode: 'add', tx: null })}
          aria-label={t.addTransaction}
          title={t.addTransaction}
        >
          <span className="fab__handle" aria-hidden="true" />
          <span className="fab__pad">
            <Icon name="plus" size={22} strokeWidth={2.4} />
          </span>
          <span className="fab__label">{t.addTransaction}</span>
        </button>
      )}
    </div>
  );
}