/**
 * Single place that reads/writes the persisted session.
 * Used by the axios client (to attach / refresh tokens) and by the auth store.
 */
const KEYS = {
  access: 'ims_access_token',
  refresh: 'ims_refresh_token',
  expiresAt: 'ims_expires_at',
  user: 'ims_user',
  context: 'ims_auth_context', // 'super_admin' | 'user'
};

const listeners = new Set();

const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => {
  try {
    if (v === null || v === undefined) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch { /* storage unavailable (private mode) - session stays in memory only */ }
};

let memory = {
  accessToken: safeGet(KEYS.access),
  refreshToken: safeGet(KEYS.refresh),
  expiresAt: Number(safeGet(KEYS.expiresAt)) || null,
  context: safeGet(KEYS.context) || null,
  user: (() => { try { return JSON.parse(safeGet(KEYS.user) || 'null'); } catch { return null; } })(),
};

export const getSession = () => memory;

export const setSession = (patch) => {
  memory = { ...memory, ...patch };
  safeSet(KEYS.access, memory.accessToken);
  safeSet(KEYS.refresh, memory.refreshToken);
  safeSet(KEYS.expiresAt, memory.expiresAt ? String(memory.expiresAt) : null);
  safeSet(KEYS.context, memory.context);
  safeSet(KEYS.user, memory.user ? JSON.stringify(memory.user) : null);
  listeners.forEach((fn) => fn(memory));
};

export const clearSessionStorage = () => setSession({
  accessToken: null, refreshToken: null, expiresAt: null, context: null, user: null,
});

/** Subscribe to session changes (token refresh, sign-out, other tabs). */
export const onSessionChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

// Keep tabs in sync: signing out (or in) in one tab updates the others.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!Object.values(KEYS).includes(e.key)) return;
    memory = {
      accessToken: safeGet(KEYS.access),
      refreshToken: safeGet(KEYS.refresh),
      expiresAt: Number(safeGet(KEYS.expiresAt)) || null,
      context: safeGet(KEYS.context) || null,
      user: (() => { try { return JSON.parse(safeGet(KEYS.user) || 'null'); } catch { return null; } })(),
    };
    listeners.forEach((fn) => fn(memory));
  });
}
