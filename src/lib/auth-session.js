// Keep identity and its data in one state; discard work from earlier sessions.
export function createAuthSession({ client, loadStore, onChange }) {
  let generation = 0;
  let stopped = false;
  let signingOut = false;
  let logoutPending = false;
  let subscription;
  let state = { status: 'loading', user: null, store: null, error: null };

  const publish = (next) => {
    if (stopped) return;
    if (state.store && state.store !== next.store) state.store.deactivate();
    state = next;
    onChange(next);
  };
  const clear = (status, error = null) => publish({ status, error, user: null, store: null });

  const accept = (session, force = false) => {
    if (stopped || signingOut || logoutPending) return;
    const user = session?.user;
    if (!force && user && state.user?.id === user.id &&
        (state.status === 'ready' || state.status === 'loading')) {
      publish({ ...state, user });
      return;
    }
    const ticket = ++generation;
    if (!user) { clear('signedOut'); return; }
    publish({ status: 'loading', user, store: null, error: null });
    // Never run Supabase queries inside the auth callback's SDK lock.
    setTimeout(async () => {
      if (stopped || ticket !== generation) return;
      try {
        const store = await loadStore(client, user);
        if (stopped || ticket !== generation) { store.deactivate(); return; }
        publish({ status: 'ready', user: state.user, store, error: null });
      } catch {
        if (!stopped && ticket === generation) clear('error', 'cloudLoadFailed');
      }
    }, 0);
  };

  const refresh = async () => {
    if (stopped || signingOut || logoutPending) return;
    const ticket = ++generation;
    clear('loading');
    try {
      const { data, error } = await client.auth.getSession();
      if (stopped || ticket !== generation || signingOut) return;
      if (error) throw error;
      accept(data.session, true);
    } catch {
      if (!stopped && ticket === generation) clear('error', 'cloudLoadFailed');
    }
  };

  return {
    start() {
      subscription = client.auth.onAuthStateChange((_event, session) => accept(session)).data.subscription;
      void refresh();
    },
    retry: refresh,
    async signOut() {
      if (signingOut) return;
      signingOut = true;
      logoutPending = true;
      ++generation;
      clear('loading');
      try {
        const { error } = await client.auth.signOut();
        if (error) throw error;
        logoutPending = false;
        clear('signedOut');
      } catch {
        clear('error', 'logoutFailed');
      } finally {
        signingOut = false;
      }
    },
    stop() {
      stopped = true;
      ++generation;
      state.store?.deactivate();
      subscription?.unsubscribe();
    },
  };
}
