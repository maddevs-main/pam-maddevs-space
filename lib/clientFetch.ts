export async function tryFetch(adminPath: string, legacyPath: string, opts: RequestInit = {}) {
  // Always send JWT in Authorization header if available
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('pam_jwt') : null;
  const headers = new Headers(opts.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const optsWithAuth = { ...opts, headers };
  try {
    let res = await fetch(adminPath, optsWithAuth);
    if (res.status === 404 || res.status === 401 || res.status === 403) {
      res = await fetch(legacyPath, optsWithAuth);
    }
    return res;
  } catch (err) {
    try {
      return await fetch(legacyPath, optsWithAuth);
    } catch (e) {
      throw err;
    }
  }
}

export default tryFetch;
