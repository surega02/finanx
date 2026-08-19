import React, { useEffect, useMemo, useState } from 'react';
import { Store, currentMonth } from './lib/store.js';
import { LANG, LANGUAGES } from './lib/i18n.js';
import { supabase, isCloudEnabled, appUserFromAuth } from './lib/supabase.js';
import Login from './components/Login.jsx';
import Shell from './components/Shell.jsx';

export const AppContext = React.createContext(null);

export function useApp() {
  return React.useContext(AppContext);
}

export default function App() {
  const [store, setStore] = useState(() => Store.load());
  const [user, setUser] = useState(null);
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

    let active = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        const s = await Store.loadCloud(supabase, data.session.user);
        if (!active) return;
        setStore(s);
        setLangState(s.state.language || 'id');
        setUser(appUserFromAuth(data.session.user));
      }
      setBooting(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session) {
        setUser(appUserFromAuth(session.user));
      } else {
        setUser(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
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
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
    }
    setUser(null);
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
      {booting ? (
        <div className="loading" role="status">
          <div className="loading__stamp"><span>F</span></div>
          <p className="loading__text">{t.loading}</p>
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
