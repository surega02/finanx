// Keep only safe classifications. Fetch/SDK messages can contain URLs or tokens.
export function cloudError(stage, error, status) {
  const failure = new Error('Cloud account loading failed');
  failure.stage = stage;
  const message = typeof error?.message === 'string' ? error.message : '';
  const serverCode = /^[A-Z0-9]{4,12}$/.test(error?.code || '') ? error.code : null;
  if (serverCode) failure.code = serverCode;
  else if (error?.name === 'AbortError' || /^AbortError:/.test(message)) failure.code = 'ABORTED';
  else if (/failed to fetch|fetch failed|networkerror|network request failed|load failed|network connection was lost/i.test(message)) failure.code = 'NETWORK';
  else if (Number.isInteger(status) && status >= 400 && status <= 599) failure.code = `HTTP${status}`;
  else if (error?.name === 'TypeError' || /^(TypeError|ReferenceError):/.test(message)) failure.code = 'CLIENTERR';
  else if (status === 0) failure.code = 'REQUESTFAIL';
  else failure.code = 'UNKNOWN';
  failure.retryable = failure.code === 'NETWORK' ||
    [408, 502, 503, 504].includes(status) && !['42501', '23505', '42P10'].includes(serverCode);
  return failure;
}

// Only use for operations whose repeat is safe: startup category seeding
// (ON CONFLICT DO NOTHING) and complete, read-only snapshots. Never tx writes.
export async function retryCloudLoad(stage, request, wait = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  const delays = [300, 900];
  for (let attempt = 0; ; attempt++) {
    let failure;
    try {
      const result = await request();
      if (!result.error) return result;
      failure = cloudError(stage, result.error, result.status);
    } catch (error) { failure = cloudError(stage, error); }
    if (!failure.retryable || attempt === delays.length) throw failure;
    await wait(delays[attempt]);
  }
}
