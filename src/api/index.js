import api, { unwrap, unwrapWithMeta } from './client.js';

const qs = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
  return { params: clean };
};

export const superAdminAuthApi = {
  login:   (email, password) => api.post('/super-admin/auth/login', { email, password }).then(unwrap),
  me:      () => api.get('/super-admin/auth/me').then(unwrap),
  logout:  () => api.post('/super-admin/auth/logout').then(unwrap),
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
    create:      (body) => api.post('/super-admin/roles', body).then(unwrap),
    setPermissions: (id, permissionIds) => api.put(`/super-admin/roles/${id}/permissions`, { permissionIds }).then(unwrap),
    remove:      (id) => api.delete(`/super-admin/roles/${id}`).then(unwrap),
  },
  logs: {
    list: (params) => api.get('/super-admin/logs', qs(params)).then(unwrapWithMeta),
  },
};

export const authApi = {
  login:   (email, password) => api.post('/auth/login', { email, password }).then(unwrap),
  me:      () => api.get('/auth/me').then(unwrap),
  logout:  () => api.post('/auth/logout').then(unwrap),
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
  remove: (id) => api.delete(`/products/${id}`),
};

export const movementsApi = {
  list:    (params) => api.get('/movements', qs(params)).then(unwrapWithMeta),
  summary: (params) => api.get('/movements/summary', qs(params)).then(unwrap),
  create:  (body) => api.post('/movements', body).then(unwrap),
};

export const alertsApi = {
  list:    (params) => api.get('/alerts', qs(params)).then(unwrapWithMeta),
  summary: () => api.get('/alerts/summary').then(unwrap),
  setStatus: (id, status, note) => api.patch(`/alerts/${id}`, { status, note }).then(unwrap),
};

export const suppliersApi = {
  list:   (params) => api.get('/suppliers', qs(params)).then(unwrap),
  get:    (id) => api.get(`/suppliers/${id}`).then(unwrap),
  create: (body) => api.post('/suppliers', body).then(unwrap),
  update: (id, body) => api.patch(`/suppliers/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/suppliers/${id}`),
};

export const categoriesApi = {
  list:   () => api.get('/categories').then(unwrap),
  create: (body) => api.post('/categories', body).then(unwrap),
  update: (id, body) => api.patch(`/categories/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const usersApi = {
  list:   (params) => api.get('/users', qs(params)).then(unwrap),
  get:    (id) => api.get(`/users/${id}`).then(unwrap),
  create: (body) => api.post('/users', body).then(unwrap),
  update: (id, body) => api.patch(`/users/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, password) => api.post(`/users/${id}/password`, { password }).then(unwrap),
};

export const rolesApi = {
  list:        () => api.get('/roles').then(unwrap),
  permissions: () => api.get('/roles/permissions').then(unwrap),
  create:      (body) => api.post('/roles', body).then(unwrap),
  setPermissions: (id, permissionIds) => api.put(`/roles/${id}/permissions`, { permissionIds }).then(unwrap),
  remove:      (id) => api.delete(`/roles/${id}`).then(unwrap),
};

export const logsApi = {
  list: (params) => api.get('/logs', qs(params)).then(unwrapWithMeta),
};
