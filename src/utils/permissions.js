/**
 * Mirrors the backend's hasUserPermission() (src/middleware/authorize.js) so the
 * UI shows exactly the pages and buttons the API will actually allow.
 * The backend remains the authority; this only decides what to display.
 */
const PERMISSION_ALIASES = {
  'movements.view': ['stock_movements.view'],
  'stock_movements.view': ['movements.view'],
  'movements.create': ['stock_movements.create'],
  'stock_movements.create': ['movements.create'],
  'movements.manage': ['stock_movements.manage'],
  'stock_movements.manage': ['movements.manage'],
  'inventory.edit': ['inventory.update'],
  'inventory.update': ['inventory.edit'],
  'inventory.manage': ['inventory.update', 'inventory.create', 'inventory.delete'],
  'audit_logs.view': ['logs.view'],
  'logs.view': ['audit_logs.view'],
  'users.edit': ['users.manage'],
  'users.create': ['users.manage'],
  'suppliers.edit': ['suppliers.manage'],
  'suppliers.create': ['suppliers.manage'],
  'reports.generate': ['reports.view'],
};

export const hasPermission = (userPerms = [], code) => {
  if (!code) return true;
  if (userPerms.includes(code)) return true;
  const [module] = code.split('.');
  if (userPerms.includes(`${module}.manage`) || userPerms.includes('system.manage')) return true;
  return (PERMISSION_ALIASES[code] || []).some((alias) => userPerms.includes(alias));
};

/** Only allow in-app paths as post-login redirects (blocks //evil.com and full URLs). */
export const safeRedirect = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (value.startsWith('/login') || value.startsWith('/super-admin/login')) return fallback;
  return value;
};
