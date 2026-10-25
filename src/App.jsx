import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { parseNavigation, routeURL } from './lib/navigation.js';
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
    if (!isCloudEnabled) {
      try { return Store.load(); } catch { const empty = Store.empty(); empty.migrationFailed = true; return empty; }
    }
    Store.clearLegacyCache();
    return Store.empty();
  });
  const [demoUser, setDemoUser] = useState(null);
  const [authState, setAuthState] = useState({ status: 'loading', store: null, user: null, error: null });
  const auth = useRef(null);
  const lastOwner = useRef(null);
  const store = isCloudEnabled ? authState.store || demoStore : demoStore;
  const user = isCloudEnabled ? (authState.status === 'ready' ? appUserFromAuth(authState.user) : null) : demoUser;
  const setUser = isCloudEnabled ? undefined : setDemoUser;
  const [lang, setLangState] = useState(() => store.state.language || 'id');
  const [url, setURL] = useState(() => window.location.search);
  const navigation = parseNavigation(url, store.state.categories);
  const view = navigation.view;
  const month = { year: navigation.year, monthIndex: navigation.month === 'all' ? currentMonth().monthIndex : navigation.month - 1 };
  const revision = useSyncExternalStore(store.subscribe, () => store.revision);
  const navigate = (target, replace = false) => {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', target);
    setURL(window.location.search);
  };
  const setView = (next) => navigate(routeURL(next));
  const setMonth = (next) => navigate(routeURL('dashboard', { year: next.year, month: next.monthIndex + 1 }));
  useEffect(() => {
    const pop = () => setURL(window.location.search);
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
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
        if (next.status === 'ready') {
          lastOwner.current = next.user.id;
          setLangState(next.store.state.language || 'id');
        }
        else {
          setSheet(null);
          setToast(null);
          // Initial cloud hydration must retain shared/refreshed URL filters.
          // Identity replacement and sign-out reset account-specific context.
          if (next.status === 'signedOut' || next.error === 'logoutFailed' ||
              lastOwner.current && next.user?.id && lastOwner.current !== next.user.id) {
            navigate(routeURL('dashboard'), true);
          }
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
    revision,
    navigation,
    navigate,
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
      {demoStore.migrationFailed ? (
        <div className="loading" role="alert"><p>{t.demoMigrationFailed}</p><button className="btn btn--ghost" onClick={() => window.location.reload()}>{t.retry}</button></div>
      ) : (isCloudEnabled ? authState.status === 'loading' : booting) ? (
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
