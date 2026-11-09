// Capture this before the SDK consumes and removes OAuth parameters from the URL.
export function authCallbackOptions(location) {
  const query = new URLSearchParams(location?.search || '');
  const hash = new URLSearchParams((location?.hash || '').replace(/^#/, ''));
  const callbackExpected = ['code', 'access_token', 'error', 'error_code', 'error_description']
    .some(key => query.has(key) || hash.has(key));
  return {
    callbackExpected,
    auth: {
      // Never let URL tokens downgrade PKCE or replace the browser's identity.
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  };
}
