import axios from 'axios';
import { getSession, setSession } from './session.js';

// Production builds must be given VITE_API_BASE_URL (e.g. https://your-api.vercel.app/api).
// The localhost fallback only exists in development so it can never ship by accident.
const configuredBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
if (!configuredBase && !import.meta.env.DEV) {
  console.error('[config] VITE_API_BASE_URL is not set for this build; API calls will go to /api on this site.');
}
const baseURL = configuredBase || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// A bare client for token refresh, so refresh calls never loop through the interceptors below.
const bare = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' }, timeout: 15000 });

const AUTH_PATHS = /\/(super-admin\/)?auth\/(login|refresh|logout)$/;
const isAuthCall = (config) => AUTH_PATHS.test(config?.url || '');

/* -------------------------------------------------------------- token refresh */
let refreshing = null;

/**
 * Exchanges the stored refresh token for a new session. Concurrent callers share
 * one in-flight request, so ten parallel 401s cause exactly one refresh.
 */
export const refreshSession = () => {
  if (refreshing) return refreshing;
  const { refreshToken, context } = getSession();
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));

  const path = context === 'super_admin' ? '/super-admin/auth/refresh' : '/auth/refresh';
  refreshing = bare.post(path, { refreshToken })
    .then((res) => {
      const s = res.data?.data || {};
      if (!s.accessToken) throw new Error('Refresh failed');
      setSession({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken || refreshToken,
        expiresAt: s.expiresAt ? Number(s.expiresAt) * 1000 : null,
      });
      return s.accessToken;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
};

const EXPIRY_MARGIN_MS = 60 * 1000;

api.interceptors.request.use(async (config) => {
  let { accessToken, expiresAt, refreshToken } = getSession();

  // Refresh proactively when the access token is about to expire.
  if (!isAuthCall(config) && accessToken && refreshToken && expiresAt && Date.now() > expiresAt - EXPIRY_MARGIN_MS) {
    try { accessToken = await refreshSession(); } catch { /* the 401 path below will handle it */ }
  }

  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let onUnauthorized = null;
let onForbidden = null;

export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
export const setForbiddenHandler = (fn) => { onForbidden = fn; };

const toAppError = (error) => {
  const status = error.response?.status;
  const message =
    error.response?.data?.error?.message ||
    (error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : null) ||
    (!error.response ? 'Cannot reach the server. Check that the backend is running.' : 'Something went wrong.');
  return Object.assign(new Error(message), {
    status,
    code: error.response?.data?.error?.code || null,
    details: error.response?.data?.error?.details || null,
    method: (error.config?.method || 'get').toLowerCase(),
    url: error.config?.url,
    isNetworkError: !error.response,
  });
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const config = error.config || {};

    // Expired access token: refresh once and replay the request.
    if (status === 401 && !isAuthCall(config) && !config._retried && getSession().refreshToken) {
      try {
        const token = await refreshSession();
        config._retried = true;
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
        return api.request(config);
      } catch { /* fall through to sign-out */ }
    }

    const appError = toAppError(error);

    if (status === 401 && !isAuthCall(config) && onUnauthorized) onUnauthorized(appError);

    // Only a failed page-data read means "you cannot see this page". A refused
    // action (save/delete) is reported in place by the view instead of
    // navigating the user away from their work.
    if (status === 403 && appError.method === 'get' && !isAuthCall(config) && !config.skipForbiddenRedirect && onForbidden) {
      onForbidden(appError);
    }

    return Promise.reject(appError);
  },
);

/** Helper: returns response.data.data, or the whole body if it isn't wrapped. */
export const unwrap = (res) => (res?.data?.data !== undefined ? res.data.data : res?.data);
export const unwrapWithMeta = (res) => ({
  data: unwrap(res),
  meta: res?.data?.meta ?? null,
  pagination: res?.data?.pagination ?? null,
});

export default api;
