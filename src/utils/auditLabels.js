/**
 * Readable labels for audit-log entries.
 *
 * The backend stores action codes in mixed styles (SUPER_ADMIN_LOGIN, login,
 * generate_report ...). The stored codes are kept as-is for filtering; these
 * helpers only change how they are shown.
 */

export const ACTION_LABELS = {
  login: 'Signed in',
  logout: 'Signed out',
  SUPER_ADMIN_LOGIN: 'Administrator signed in',
  SUPER_ADMIN_LOGOUT: 'Administrator signed out',
  super_admin_login_denied: 'Administrator sign-in denied',
  normal_login_denied_super_admin: 'Staff sign-in denied',

  USER_CREATED: 'User created',
  USER_UPDATED: 'User updated',
  USER_ROLE_CHANGED: 'User role changed',
  USER_ACTIVATED: 'User activated',
  USER_DEACTIVATED: 'User deactivated',
  USER_PASSWORD_RESET: 'Password reset',
  USER_DELETED: 'User deleted',

  ROLE_CREATED: 'Role created',
  ROLE_UPDATED: 'Role updated',
  ROLE_ACTIVATED: 'Role activated',
  ROLE_DEACTIVATED: 'Role deactivated',
  ROLE_DELETED: 'Role deleted',
  ROLE_ASSIGNED: 'Role permissions updated',
  PERMISSION_ADDED: 'Permission added',

  PRODUCT_CREATED: 'Product created',
  PRODUCT_UPDATED: 'Product updated',
  PRODUCT_ARCHIVED: 'Product archived',
  PRODUCT_DELETED: 'Product deleted',
  CATEGORY_CREATED: 'Category created',
  CATEGORY_UPDATED: 'Category updated',
  CATEGORY_DELETED: 'Category deleted',
  SUPPLIER_CREATED: 'Supplier created',
  SUPPLIER_UPDATED: 'Supplier updated',
  SUPPLIER_DELETED: 'Supplier deleted',

  STOCK_IN: 'Stock received',
  STOCK_OUT: 'Stock issued',
  STOCK_RETURNED: 'Stock returned',
  STOCK_ADJUSTMENT: 'Stock adjusted',
  ITEM_DAMAGED: 'Damaged stock recorded',
  ITEM_MISSING: 'Missing stock recorded',
  RECORD_MOVEMENT: 'Stock movement recorded',
  STOCK_COUNT_MATCHED: 'Stock count matched',
  STOCK_COUNT_VARIANCE: 'Stock count variance',
  update_thresholds: 'Stock thresholds updated',
  recheck_alerts: 'Alerts re-checked',
  ALERT_ACKNOWLEDGED: 'Alert acknowledged',
  ALERT_RESOLVED: 'Alert resolved',

  generate_report: 'Report generated',
};

export const ENTITY_LABELS = {
  auth: 'Sign-in',
  users: 'User',
  roles: 'Role',
  products: 'Product',
  categories: 'Category',
  suppliers: 'Supplier',
  inventory: 'Inventory',
  stock_movements: 'Stock movement',
  alerts: 'Alert',
  reports: 'Report',
};

const sentence = (code) => {
  const words = String(code || '').replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : '—';
};

export const actionLabel = (code) => ACTION_LABELS[code] || sentence(code);
export const entityLabel = (code) => ENTITY_LABELS[code] || sentence(code);

/** Tone used for the action badge colour. */
export const actionTone = (code) => {
  const c = String(code || '').toUpperCase();
  if (c.includes('DENIED')) return 'danger';
  if (c.includes('DELETED') || c.includes('DEACTIVATED') || c.includes('DAMAGED') || c.includes('MISSING')) return 'danger';
  if (c.includes('CREATED') || c.includes('ACTIVATED') || c.includes('ADDED') || c.includes('RESOLVED') || c === 'STOCK_IN') return 'success';
  if (c.includes('ROLE_CHANGED') || c.includes('ASSIGNED') || c.includes('RESET') || c.includes('VARIANCE')) return 'warning';
  if (c.includes('SUPER_ADMIN')) return 'admin';
  if (c.includes('UPDATED') || c.includes('ADJUSTMENT') || c.includes('ARCHIVED')) return 'info';
  return 'neutral';
};

const KEY_LABELS = {
  role: 'Role', roleCode: 'Role', roleName: 'Role', report: 'Report', endpoint: null, attempt: null,
  revoked: null, username: 'Username', fullName: 'Name', name: 'Name', product: 'Product', sku: 'SKU',
  movementType: 'Type', quantity: 'Quantity', status: 'Status', note: 'Note', reason: 'Reason',
};

const valueText = (v) => {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.length > 3 ? `${v.length} items` : v.map(valueText).join(', ');
  if (typeof v === 'object') return '';
  return String(v).replace(/_/g, ' ');
};

/** One short, human-readable line from an entry's details object. */
export const detailsSummary = (details) => {
  if (!details || typeof details !== 'object') return '';
  const parts = [];
  for (const [k, v] of Object.entries(details)) {
    if (KEY_LABELS[k] === null) continue; // technical keys are left to the full view
    const text = valueText(v);
    if (!text) continue;
    const label = KEY_LABELS[k] || sentence(k.replace(/([a-z])([A-Z])/g, '$1 $2'));
    parts.push(`${label}: ${text}`);
    if (parts.length === 3) break;
  }
  return parts.join(' · ');
};
