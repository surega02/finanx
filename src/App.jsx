import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Store, currentMonth } from './lib/store.js';
import { LANG, LANGUAGES } from './lib/i18n.js';
import { supabase, isCloudEnabled, appUserFromAuth } from './lib/supabase.js';
import { createAuthSession } from './lib/auth-session.js';
import Login from './components/Login.jsx';
import Shell from './components/Shell.jsx';

export const AppContext = React.createContext(null);

export function useApp() {
  return React.useContext(AppContext);
}

export default function App() {
  const [demoStore] = useState(() => {
    if (!isCloudEnabled) return Store.load();
    Store.clearLegacyCache();
    return Store.empty();
  });
  const [demoUser, setDemoUser] = useState(null);
  const [authState, setAuthState] = useState({ status: 'loading', store: null, user: null, error: null });
  const auth = useRef(null);
  const store = isCloudEnabled ? authState.store || demoStore : demoStore;
  const user = isCloudEnabled ? (authState.status === 'ready' ? appUserFromAuth(authState.user) : null) : demoUser;
  const setUser = isCloudEnabled ? undefined : setDemoUser;
  const [lang, setLangState] = useState(() => store.state.language || 'id');
  const [view, setView] = useState('dashboard');
  const [month, setMonth] = useState(() => currentMonth());
  const [sheet, setSheet] = useState(null); // { mode: 'add' | 'edit', tx: null | {...} }
  const [toast, setToast] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!isCloudEnabled) {
      const timer = setTimeout(() => setBooting(false), 500);
      return () => clearTimeout(timer);
    }

    const controller = createAuthSession({
      client: supabase,
      loadStore: Store.loadCloud,
      onChange: (next) => {
        setAuthState(next);
        if (next.status === 'ready') setLangState(next.store.state.language || 'id');
        else {
          setSheet(null);
          setToast(null);
          setView('dashboard');
          setMonth(currentMonth());
        }
      },
    });
    auth.current = controller;
    controller.start();
    return () => controller.stop();
  }, []);

  const t = useMemo(() => LANG[lang] || LANG.id, [lang]);

  const setLang = (next) => {
    setLangState(next);
    store.setLanguage(next);
  };

  const pushToast = (message, actionLabel, onAction) => {
    setToast({ message, actionLabel, onAction, key: Date.now() });
  };

  const dismissToast = () => setToast(null);

  const signOut = async () => {
    if (isCloudEnabled) {
      Store.clearLegacyCache();
      await auth.current.signOut();
    } else {
      setDemoUser(null);
      setSheet(null);
      setToast(null);
      setView('dashboard');
    }
  };

  const value = {
    store,
    t,
    lang,
    setLang,
    user,
    setUser,
    view,
    setView,
    month,
    setMonth,
    sheet,
    setSheet,
    toast,
    pushToast,
    dismissToast,
    currentMonth: currentMonth(),
    signOut,
  };

  return (
    <AppContext.Provider value={value}>
      {(isCloudEnabled ? authState.status === 'loading' : booting) ? (
        <div className="loading" role="status">
          <div className="loading__stamp"><span>F</span></div>
          <p className="loading__text">{t.loading}</p>
        </div>
      ) : isCloudEnabled && authState.status === 'error' ? (
        <div className="loading" role="alert">
          <p>{t[authState.error]}</p>
          {authState.diagnostic && (
            <>
              <p>{t.authDiagnostic}: <code>{authState.diagnostic.stage} / {authState.diagnostic.code}</code></p>
              {['23505', '42P10'].includes(authState.diagnostic.code) && <p>{t.authSchemaMismatch}</p>}
              {authState.diagnostic.code === '42501' && <p>{t.authAccessDenied}</p>}
            </>
          )}
          <button type="button" className="btn btn--ink" onClick={() => authState.error === 'logoutFailed' ? signOut() : auth.current.retry()}>
            {t.retry}
          </button>
          {authState.error !== 'logoutFailed' && (
            <button type="button" className="btn" onClick={signOut}>{t.logout}</button>
          )}
        </div>
      ) : user ? (
        <Shell />
      ) : (
        <Login />
      )}
    </AppContext.Provider>
  );
}

export { LANGUAGES };
