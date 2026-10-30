// Small client for the Cubiphy API (/api/*). Keeps the session in localStorage and
// refreshes the access token automatically when it expires.
const KEY = 'lp-session-v1';
// Where the backend API lives, e.g. https://learn-physics-api.vercel.app/api (set VITE_API_URL at build time).
const BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

let session = null;
try { session = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { session = null; }
const listeners = new Set();
function setSession(s) {
  session = s;
  try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch { /* private mode */ }
  listeners.forEach((fn) => fn(s));
}
export const getSession = () => session;
export const onSession = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export class ApiError extends Error { constructor(status, code, message) { super(message || code); this.status = status; this.code = code; } }

// Requests in flight, so the UI can show a loading indicator (it does not change any request).
let pending = 0; const busyListeners = new Set();
const setPending = (d) => { pending += d; busyListeners.forEach((fn) => fn(pending)); };
export const onBusy = (fn) => { busyListeners.add(fn); return () => busyListeners.delete(fn); };
export const isBusy = () => pending > 0;

async function raw(method, path, body, token) {
  setPending(1);
  try { return await rawFetch(method, path, body, token); } finally { setPending(-1); }
}
async function rawFetch(method, path, body, token) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch { throw new ApiError(0, 'network', 'Network error'); }
  if (res.status === 204) return null;
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) throw new ApiError(res.status, data?.error || 'error', data?.message || res.statusText);
  if (data === null && text) throw new ApiError(res.status, 'not_api', 'The API is not available here');
  return data;
}

let refreshing = null;
async function refresh() {
  if (!session?.refresh_token) throw new ApiError(401, 'unauthorized', 'Sign in again');
  refreshing = refreshing || raw('POST', '/auth/refresh', { refresh_token: session.refresh_token })
    .then((d) => { setSession({ ...session, ...d.session }); })
    .catch((e) => { if (e.status === 401) setSession(null); throw e; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function api(method, path, body) {
  if (session && session.expires_at && session.expires_at * 1000 < Date.now() + 30000) { try { await refresh(); } catch { /* handled below */ } }
  try { return await raw(method, path, body, session?.access_token); }
  catch (e) {
    if (e.status !== 401 || !session) throw e;
    await refresh();
    return raw(method, path, body, session?.access_token);
  }
}

export const health = () => raw('GET', '/health');
export async function signUp(form) {
  const d = await raw('POST', '/auth/signup', form);
  if (d.session) setSession({ ...d.session, user: d.user });
  return d;
}
export async function signIn(email, password) {
  const d = await raw('POST', '/auth/login', { email, password });
  setSession({ ...d.session, user: d.user });
  return d;
}
export const forgotPassword = (email) => raw('POST', '/auth/forgot', { email });
export async function resetPassword(recovery, password) {
  const d = await raw('POST', '/auth/reset', { ...recovery, password });
  setSession({ ...d.session, user: d.user });
  return d;
}
export const signOut = () => setSession(null);
export const saveUser = (user) => session && setSession({ ...session, user });
