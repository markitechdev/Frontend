import api, { unwrap, unwrapWithMeta } from './client.js';
import { cached, invalidate } from './cache.js';

/** Clears cached reference data after a write to that resource. */
const mutate = (prefix) => (res) => { invalidate(prefix); return res; };

const qs = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
  return { params: clean };
};

export const superAdminAuthApi = {
  login:   (email, password) => api.post('/super-admin/auth/login', { email, password }).then(unwrap),
  me:      () => api.get('/super-admin/auth/me').then(unwrap),
  logout:  (refreshToken) => api.post('/super-admin/auth/logout', refreshToken ? { refreshToken } : {}).then(unwrap),
  refresh: (refreshToken) => api.post('/super-admin/auth/refresh', { refreshToken }).then(unwrap),
};

export const superAdminApi = {
  getDashboard: () => api.get('/super-admin/dashboard').then(unwrap),
  getStats:     () => api.get('/super-admin/stats').then(unwrap),
  getTenants:   () => api.get('/super-admin/tenants').then(unwrap),
  users: {
    list:   (params) => api.get('/super-admin/users', qs(params)).then(unwrap),
    get:    (id) => api.get(`/super-admin/users/${id}`).then(unwrap),
    create: (body) => api.post('/super-admin/users', body).then(unwrap),
    update: (id, body) => api.patch(`/super-admin/users/${id}`, body).then(unwrap),
    remove: (id) => api.delete(`/super-admin/users/${id}`),
    resetPassword: (id, password) => api.post(`/super-admin/users/${id}/password`, { password }).then(unwrap),
  },
  roles: {
    list:        () => api.get('/super-admin/roles').then(unwrap),
    permissions: () => api.get('/super-admin/roles/permissions').then(unwrap),
    get:         (id) => api.get(`/super-admin/roles/${id}`).then(unwrap),
    getUsers:    (id) => api.get(`/super-admin/roles/${id}/users`).then(unwrap),
    create:      (body) => api.post('/super-admin/roles', body).then(unwrap).then(mutate('roles')),
    update:      (id, body) => api.patch(`/super-admin/roles/${id}`, body).then(unwrap).then(mutate('roles')),
    setPermissions: (id, permissionIds) => api.put(`/super-admin/roles/${id}/permissions`, { permissionIds }).then(unwrap).then(mutate('roles')),
    remove:      (id) => api.delete(`/super-admin/roles/${id}`).then(unwrap).then(mutate('roles')),
  },
  logs: {
    list: (params) => api.get('/super-admin/logs', qs(params)).then(unwrapWithMeta),
  },
};

export const authApi = {
  login:   (email, password) => api.post('/auth/login', { email, password }).then(unwrap),
  me:      () => api.get('/auth/me').then(unwrap),
  logout:  (refreshToken) => api.post('/auth/logout', refreshToken ? { refreshToken } : {}).then(unwrap),
};

export const dashboardApi = {
  get: () => api.get('/dashboard').then(unwrap),
};

export const inventoryApi = {
  list:    (params) => api.get('/inventory', qs(params)).then(unwrapWithMeta),
  summary: () => api.get('/inventory/summary').then(unwrap),
  updateThresholds: (productId, body) => api.patch(`/inventory/${productId}`, body).then(unwrap),
  recheckAlerts: () => api.post('/inventory/recheck-alerts').then(unwrap),
};

export const productsApi = {
  list:   (params) => api.get('/products', qs(params)).then(unwrap),
  get:    (id) => api.get(`/products/${id}`).then(unwrap),
  create: (body) => api.post('/products', body).then(unwrap),
  update: (id, body) => api.patch(`/products/${id}`, body).then(unwrap),
  /** Resolves to { archived: true, message } when the product had history and was archived instead. */
  remove: (id) => api.delete(`/products/${id}`).then((res) => (res.status === 204 ? { archived: false } : unwrap(res))),
};

export const movementsApi = {
  list:    (params) => api.get('/movements', qs(params)).then(unwrapWithMeta),
  summary: (params) => api.get('/movements/summary', qs(params)).then(unwrap),
  create:  (body) => api.post('/movements', body).then(unwrap),
  /** Physical (cycle) count: the server records the variance as missing / adjustment. */
  count:   (body) => api.post('/movements/count', body).then(unwrap),
};

export const alertsApi = {
  list:    (params) => api.get('/alerts', qs(params)).then(unwrapWithMeta),
  summary: () => api.get('/alerts/summary').then(unwrap),
  setStatus: (id, status, note) => api.patch(`/alerts/${id}`, { status, note }).then(unwrap),
};

export const suppliersApi = {
  list:   (params = {}) => {
    const run = () => api.get('/suppliers', { ...qs(params), skipForbiddenRedirect: params.active === 'true' && !params.search }).then(unwrap);
    // Only the plain "active suppliers" dropdown list is cached; searches always hit the server.
    return !params.search && params.active === 'true' ? cached('suppliers:active', run) : run();
  },
  get:    (id) => api.get(`/suppliers/${id}`).then(unwrap),
  create: (body) => api.post('/suppliers', body).then(unwrap).then(mutate('suppliers')),
  update: (id, body) => api.patch(`/suppliers/${id}`, body).then(unwrap).then(mutate('suppliers')),
  remove: (id) => api.delete(`/suppliers/${id}`).then(mutate('suppliers')),
};

export const categoriesApi = {
  // Secondary data for dropdowns: a 403 just leaves the dropdown empty instead of leaving the page
  list:   () => cached('categories', () => api.get('/categories', { skipForbiddenRedirect: true }).then(unwrap)),
  create: (body) => api.post('/categories', body).then(unwrap).then(mutate('categories')),
  update: (id, body) => api.patch(`/categories/${id}`, body).then(unwrap).then(mutate('categories')),
  remove: (id) => api.delete(`/categories/${id}`).then(mutate('categories')),
};

export const usersApi = {
  list:   (params) => api.get('/users', qs(params)).then(unwrap),
  get:    (id) => api.get(`/users/${id}`).then(unwrap),
  create: (body) => api.post('/users', body).then(unwrap).then(mutate('roles')),
  update: (id, body) => api.patch(`/users/${id}`, body).then(unwrap).then(mutate('roles')),
  remove: (id) => api.delete(`/users/${id}`).then(mutate('roles')),
  resetPassword: (id, password) => api.post(`/users/${id}/password`, { password }).then(unwrap),
};

export const rolesApi = {
  list:        () => cached('roles', () => api.get('/roles').then(unwrap), 30_000),
  permissions: () => api.get('/roles/permissions').then(unwrap),
  get:         (id) => api.get(`/roles/${id}`).then(unwrap),
  getUsers:    (id) => api.get(`/roles/${id}/users`).then(unwrap),
  create:      (body) => api.post('/roles', body).then(unwrap).then(mutate('roles')),
  setPermissions: (id, permissionIds) => api.put(`/roles/${id}/permissions`, { permissionIds }).then(unwrap).then(mutate('roles')),
  remove:      (id) => api.delete(`/roles/${id}`).then(unwrap).then(mutate('roles')),
};

/** Sales & transactions (finance.view / finance.manage). */
export const salesApi = {
  list:    (params) => api.get('/sales', qs(params)).then(unwrapWithMeta),
  get:     (id) => api.get(`/sales/${id}`).then(unwrap),
  summary: (params) => api.get('/sales/summary', qs(params)).then(unwrap),
  create:  (body) => api.post('/sales', body).then(unwrap),
  void:    (id, body) => api.post(`/sales/${id}/void`, body || {}).then(unwrap),
};

export const logsApi = {
  list: (params) => api.get('/logs', qs(params)).then(unwrapWithMeta),
};

/** Server-side reports (gated by reports.view on the backend). */
export const reportsApi = {
  inventorySummary: (params) => api.get('/reports/inventory-summary', qs(params)).then(unwrapWithMeta),
  stockMovements:   (params) => api.get('/reports/stock-movements', qs(params)).then(unwrapWithMeta),
  shrinkage:        (params) => api.get('/reports/shrinkage', qs(params)).then(unwrapWithMeta),
  lowStock:         (params) => api.get('/reports/low-stock', qs(params)).then(unwrapWithMeta),
  outOfStock:       (params) => api.get('/reports/out-of-stock', qs(params)).then(unwrapWithMeta),
  reorder:          (params) => api.get('/reports/reorder', qs(params)).then(unwrapWithMeta),
  suppliers:        (params) => api.get('/reports/suppliers', qs(params)).then(unwrapWithMeta),
};
