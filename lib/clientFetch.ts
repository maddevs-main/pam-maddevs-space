export async function tryFetch(adminPath: string, legacyPath: string, opts: RequestInit = {}) {
  try {
    let res = await fetch(adminPath, opts);
    // If admin endpoint is not accessible or requires auth, fall back to legacy public endpoint
    if (res.status === 404 || res.status === 401 || res.status === 403) {
      res = await fetch(legacyPath, opts);
    }
    return res;
  } catch (err) {
    // If network error when calling admin, try legacy
    try {
      return await fetch(legacyPath, opts);
    } catch (e) {
      throw err;
    }
  }
}

export default tryFetch;
