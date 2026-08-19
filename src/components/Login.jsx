import React, { useState } from 'react';
import { Icon } from '../lib/icons.jsx';
import { useApp } from '../App.jsx';
import { supabase, isCloudEnabled } from '../lib/supabase.js';
import logo from '../assets/logo.png';

export default function Login() {
  const { t, setUser, store } = useApp();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    if (isCloudEnabled) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        setBusy(false);
      }
      return;
    }
    // Simulated Google sign-in; replaces the Firebase Auth flow.
    setTimeout(() => {
      setUser(store.state.user);
    }, 700);
  };

  return (
    <div className="login">
      <section className="login__cover" aria-label={t.appName}>
        <div className="login__plate">
          <img className="login__logo" src={logo} alt={t.appName} />
          <p className="login__tag">{t.tagline}</p>
          <hr className="login__rule" />
          <p className="login__foot">Buku Keuangan Pribadi</p>
        </div>
      </section>

      <section className="login__panel">
        <div>
          <h2 className="login__panel-title">{t.signIn}</h2>
          <p className="login__panel-note">{t.signInNote}</p>
        </div>
        <button
          type="button"
          className="login__google"
          onClick={signIn}
          disabled={busy}
        >
          <Icon name="google" size={20} strokeWidth={1.9} />
          {busy ? t.signingIn : t.signIn}
        </button>
        {!isCloudEnabled && (
          <p className="login__demo-note">
            <Icon name="stamp" size={13} />
            {t.demoSignIn}
          </p>
        )}
      </section>
    </div>
  );
}