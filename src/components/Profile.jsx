import React from 'react';
import { useApp } from '../App.jsx';
import { Icon } from '../lib/icons.jsx';
import { shortDate } from '../lib/format.js';

export default function Profile() {
  const { user, store, t, lang, setLang, signOut } = useApp();
  const { state } = store;

  const initials = (user?.name || 'F').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <div className="section-head">
        <h1 className="section-head__title">{t.profile}</h1>
      </div>

      <div className="profile-card">
        <div className="profile-card__band" />
        <div className="profile-card__body">
          <div className="profile-card__photo">
            {user?.photo ? <img src={user.photo} alt="" /> : <span>{initials}</span>}
          </div>
          <div>
            <h2 className="profile-card__name">{user?.name || state.user.name}</h2>
            <p className="profile-card__email">{user?.email || state.user.email}</p>
          </div>
        </div>
        <div className="profile-card__meta">
          <div className="profile-card__meta-cell">
            <div className="profile-card__meta-label">{t.memberSince}</div>
            <div className="profile-card__meta-value num">{shortDate(state.user.created_at.slice(0, 10), lang)}</div>
          </div>
          <div className="profile-card__meta-cell">
            <div className="profile-card__meta-label">{t.lastUpdated}</div>
            <div className="profile-card__meta-value num">{shortDate(state.user.updated_at.slice(0, 10), lang)}</div>
          </div>
        </div>
      </div>

      <div className="plate mt-3">
        <div className="plate__head">
          <h2 className="plate__title">
            <Icon name="language" size={16} />
            {t.languageLabel}
          </h2>
        </div>
        <div className="plate__body">
          <div className="lang-pick">
            {[
              { id: 'id', label: 'Bahasa Indonesia' },
              { id: 'en', label: 'English' },
            ].map((l) => (
              <button
                key={l.id}
                type="button"
                className={`lang-pick__btn ${lang === l.id ? 'lang-pick__btn--active' : ''}`}
                onClick={() => setLang(l.id)}
                aria-pressed={lang === l.id}
              >
                <Icon name="language" size={18} />
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button type="button" className="btn btn--ink" onClick={() => signOut()}>
          <Icon name="logout" size={16} />
          {t.logout}
        </button>
      </div>
    </>
  );
}