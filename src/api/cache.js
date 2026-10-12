import { onSessionChange } from './session.js';

/**
 * Tiny in-memory request cache for reference data that rarely changes
 * (categories, active suppliers, roles). Navigating between pages reuses the
 * last result for `ttl` ms, concurrent callers share one request, and any
 * write to that resource clears it. Everything is dropped on sign-in/out so
 * one user's data is never shown to the next.
 */
const store = new Map(); // key -> { at, promise }

export const cached = (key, fetcher, ttl = 60_000) => {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.promise;
  const promise = fetcher().catch((err) => { store.delete(key); throw err; });
  store.set(key, { at: Date.now(), promise });
  return promise;
};

export const invalidate = (prefix) => {
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
};

export const clearCache = () => store.clear();

let lastToken = null;
onSessionChange((s) => {
  // New user or signed out -> forget everything. (A token refresh keeps the same user.)
  const userId = s.user?.id || null;
  if (userId !== lastToken) { lastToken = userId; clearCache(); }
});
