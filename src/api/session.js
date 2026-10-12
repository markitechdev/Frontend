/**
 * Persisted sign-in sessions.
 *
 * The staff area and the Super Admin area keep SEPARATE sessions:
 *   ims_session_user         -> staff / admin accounts  (/login, /dashboard, ...)
 *   ims_session_super_admin  -> Super Admin accounts    (/super-admin/...)
 *
 * The page you are on decides which one is used ("active context"), so
 * signing in or out on one side never signs you in or out on the other, and
 * a tab on one side is not affected by a sign-in in a tab on the other side.
 * Tabs on the same side stay in sync.
 */
export const CONTEXTS = ['user', 'super_admin'];
const STORAGE_KEY = { user: 'ims_session_user', super_admin: 'ims_session_super_admin' };
const EMPTY = Object.freeze({ accessToken: null, refreshToken: null, expiresAt: null, user: null });

/** Which session a path belongs to. */
export const contextForPath = (path = '') => (String(path).startsWith('/super-admin') ? 'super_admin' : 'user');

const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => {
  try {
    if (v === null || v === undefined) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch { /* storage unavailable (private mode) - session stays in memory only */ }
};

const read = (ctx) => {
  try {
    const s = JSON.parse(safeGet(STORAGE_KEY[ctx]) || 'null');
    if (!s || typeof s !== 'object') return { ...EMPTY };
    return {
      accessToken: s.accessToken || null,
      refreshToken: s.refreshToken || null,
      expiresAt: Number(s.expiresAt) || null,
      user: s.user || null,
    };
  } catch {
    return { ...EMPTY };
  }
};

const write = (ctx, s) => {
  safeSet(STORAGE_KEY[ctx], s.accessToken ? JSON.stringify(s) : null);
};

/* One-time move from the old shared keys (ims_access_token, ...) into the
   session of the side it was created on, so nobody is signed out by the update. */
(() => {
  const old = ['ims_access_token', 'ims_refresh_token', 'ims_expires_at', 'ims_user', 'ims_auth_context'];
  const token = safeGet('ims_access_token');
  if (token) {
    const ctx = safeGet('ims_auth_context') === 'super_admin' ? 'super_admin' : 'user';
    if (!safeGet(STORAGE_KEY[ctx])) {
      let user = null;
      try { user = JSON.parse(safeGet('ims_user') || 'null'); } catch { /* ignore */ }
      write(ctx, {
        accessToken: token,
        refreshToken: safeGet('ims_refresh_token'),
        expiresAt: Number(safeGet('ims_expires_at')) || null,
        user,
      });
    }
  }
  old.forEach((k) => safeSet(k, null));
})();

const memory = { user: read('user'), super_admin: read('super_admin') };
let active = typeof window !== 'undefined' ? contextForPath(window.location.pathname) : 'user';

const listeners = new Set();
const notify = (ctx) => {
  if (ctx !== active) return; // only the side on screen is reflected in the UI
  const s = getSession();
  listeners.forEach((fn) => fn(s));
};

export const getActiveContext = () => active;

/** Switch the side in use (called by the router before every navigation). */
export const setActiveContext = (ctx) => {
  if (!CONTEXTS.includes(ctx) || ctx === active) return;
  active = ctx;
  notify(ctx);
};

/** Session of the given side (defaults to the side on screen). */
export const getSession = (ctx = active) => ({ ...memory[ctx], context: ctx });

export const setSession = (patch, ctx = active) => {
  const { context, ...rest } = patch; // context is never stored inside a session
  memory[ctx] = { ...memory[ctx], ...rest };
  write(ctx, memory[ctx]);
  notify(ctx);
};

export const clearSessionStorage = (ctx = active) => {
  memory[ctx] = { ...EMPTY };
  write(ctx, memory[ctx]);
  notify(ctx);
};

/** Subscribe to changes of the active session (sign-in/out, token refresh, other tabs, switching sides). */
export const onSessionChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

// Keep tabs on the same side in sync (sign-out in one staff tab signs out the other staff tabs).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    const ctx = CONTEXTS.find((c) => STORAGE_KEY[c] === e.key);
    if (!ctx) return;
    memory[ctx] = read(ctx);
    notify(ctx);
  });
}
