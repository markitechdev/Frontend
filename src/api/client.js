import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach access token and tenant isolation header to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ims_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const storedUser = localStorage.getItem('ims_user');
  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      const tenant = u.tenantId || u.organizationId || 'default-org';
      if (tenant) {
        config.headers['x-tenant-id'] = tenant;
      }
    } catch {
      // ignore parse error
    }
  }
  return config;
});

let onUnauthorized = null;
let onForbidden = null;

export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
export const setForbiddenHandler = (fn) => { onForbidden = fn; };

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorCode = error.response?.data?.error?.code || null;
    const message =
      error.response?.data?.error?.message ||
      (error.code === 'ECONNABORTED' ? 'The request timed out.' : null) ||
      (!error.response ? 'Cannot reach the API. Is the backend running?' : 'Something went wrong.');

    if (status === 401 && onUnauthorized) onUnauthorized();
    if (status === 403 && onForbidden) onForbidden(error);

    return Promise.reject(Object.assign(new Error(message), {
      status,
      code: errorCode,
      details: error.response?.data?.error?.details || null,
    }));
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
