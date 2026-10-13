import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { safeRedirect } from '@/utils/permissions';
import { setActiveContext, contextForPath, getSession } from '@/api/session';

/**
 * Route metadata specifications:
 * meta.superAdmin  - route strictly requires verified Super Admin platform privileges
 * meta.permission  - a single tenant/account permission code required
 * meta.anyOf       - array of permission codes; at least one is required
 * meta.public      - route is reachable while signed out
 * meta.layout      - 'blank' | 'super-admin' | default
 * meta.title       - page document title
 */
const routes = [
  // Normal Authentication
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true, layout: 'blank', title: 'Sign In' },
  },

  // Dedicated Super Admin Authentication
  {
    path: '/super-admin/login',
    name: 'super-admin-login',
    component: () => import('@/views/super-admin/SuperAdminLoginView.vue'),
    meta: { public: true, layout: 'blank', title: 'Super Admin Sign In' },
  },

  // Dedicated Super Admin Platform Routes
  {
    path: '/super-admin/dashboard',
    name: 'super-admin-dashboard',
    component: () => import('@/views/super-admin/SuperAdminDashboardView.vue'),
    meta: {
      superAdmin: true,
      layout: 'super-admin',
      title: 'Administration Dashboard',
    },
  },
  {
    path: '/super-admin/users',
    name: 'super-admin-users',
    component: () => import('@/views/super-admin/SuperAdminUsersView.vue'),
    meta: {
      superAdmin: true,
      layout: 'super-admin',
      title: 'User Accounts',
    },
  },
  {
    path: '/super-admin/roles',
    name: 'super-admin-roles',
    component: () => import('@/views/super-admin/SuperAdminRolesView.vue'),
    meta: {
      superAdmin: true,
      layout: 'super-admin',
      title: 'Roles & Permissions',
    },
  },
  {
    path: '/super-admin/tenants',
    name: 'super-admin-tenants',
    component: () => import('@/views/super-admin/SuperAdminTenantsView.vue'),
    meta: {
      superAdmin: true,
      layout: 'super-admin',
      title: 'Organization',
    },
  },
  {
    path: '/super-admin/logs',
    name: 'super-admin-logs',
    component: () => import('@/views/super-admin/SuperAdminLogsView.vue'),
    meta: {
      superAdmin: true,
      layout: 'super-admin',
      title: 'Audit Logs',
    },
  },

  // Root redirect
  {
    path: '/',
    redirect: '/dashboard',
  },

  // Normal / Tenant Dashboard
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard' },
  },

  // Operational Inventory Modules
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/views/inventory/InventoryView.vue'),
    meta: { title: 'Inventory Management', permission: 'inventory.view' },
  },
  {
    path: '/inventory/:id',
    name: 'product-detail',
    component: () => import('@/views/inventory/ProductDetailView.vue'),
    meta: { title: 'Product Details', permission: 'products.view' },
    // Non-numeric ids go straight to the 404 page instead of a failed API call
    beforeEnter: (to) => (/^\d+$/.test(String(to.params.id)) ? true : { name: 'not-found', params: { pathMatch: to.path.slice(1).split('/') } }),
  },

  {
    path: '/movements',
    name: 'movements',
    component: () => import('@/views/inventory/MovementsView.vue'),
    meta: { title: 'Stock Movements', permission: 'movements.view' },
  },

  {
    path: '/alerts',
    name: 'alerts',
    component: () => import('@/views/inventory/AlertsView.vue'),
    meta: { title: 'Alerts & Reorder Due', permission: 'alerts.view' },
  },

  {
    path: '/suppliers',
    name: 'suppliers',
    component: () => import('@/views/inventory/SuppliersView.vue'),
    meta: { title: 'Suppliers', permission: 'suppliers.view' },
  },

  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/views/ReportsView.vue'),
    meta: { title: 'Reports & Analytics', anyOf: ['reports.view', 'reports.generate'] },
  },

  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/admin/UsersView.vue'),
    meta: { title: 'User Management', permission: 'users.view' },
  },
  {
    path: '/roles',
    name: 'roles',
    component: () => import('@/views/admin/RolesView.vue'),
    meta: { title: 'Roles & Permissions', anyOf: ['roles.view', 'roles.manage'] },
  },
  {
    path: '/activity',
    name: 'activity',
    component: () => import('@/views/admin/ActivityLogView.vue'),
    meta: { title: 'System Activity Logs', permission: 'logs.view' },
  },

  {
    path: '/finance',
    name: 'finance',
    component: () => import('@/views/FinanceView.vue'),
    // Finance figures come from /api/reports, so the role also needs report access
    meta: { title: 'Financial Records', permission: 'finance.view', anyOf: ['reports.view', 'reports.generate'] },
  },
  {
    path: '/staff',
    name: 'staff',
    component: () => import('@/views/StaffView.vue'),
    meta: { title: 'Staff Directory', permission: 'staff.view' },
  },

  // Security and Fallback Routes
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
    meta: { title: 'Access Denied', layout: 'auto' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page Not Found', public: true, layout: 'auto' },
  },
];

/** Begins loading a route's lazy page component and its layout (no waiting). */
const prefetched = new Set();
const prefetchRoute = (to) => {
  const loaders = to.matched
    .map((r) => r.components?.default)
    .filter((c) => typeof c === 'function');
  if (!to.meta.public && to.meta.layout !== 'blank' && to.meta.layout !== 'auto') {
    loaders.push(isSuperAdminPath(to.path)
      ? () => import('@/components/layout/SuperAdminLayout.vue')
      : () => import('@/components/layout/AppLayout.vue'));
  }
  for (const load of loaders) {
    if (prefetched.has(load)) continue;
    prefetched.add(load);
    try { Promise.resolve(load()).catch(() => prefetched.delete(load)); } catch { prefetched.delete(load); }
  }
};
const isSuperAdminPath = (path) => path.startsWith('/super-admin');

/** Confirms the saved session with the server without holding up the page. */
let backgroundCheck = null;
const verifyInBackground = () => {
  if (backgroundCheck) return;
  const auth = useAuthStore();
  backgroundCheck = auth.ensureVerified()
    .then(() => {
      const current = router.currentRoute.value;
      if (!current.matched.length || current.meta.public) return;
      if (!auth.token) {
        // The server rejected the saved session: back to that side's sign-in.
        router.replace({
          name: isSuperAdminPath(current.path) ? 'super-admin-login' : 'login',
          query: { redirect: current.fullPath, expired: 'true' },
        });
        return;
      }
      // Permissions may have changed since sign-in.
      const { permission, anyOf } = current.meta;
      if ((permission && !auth.can(permission)) || (anyOf && !auth.canAny(...anyOf))) {
        router.replace({ name: 'forbidden', query: { from: current.fullPath } });
      }
    })
    .catch(() => {})
    .finally(() => { backgroundCheck = null; });
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Restore scroll on Back/Forward; keep position when only the query (filters) changes.
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) return savedPosition;
    if (to.path === from.path) return false;
    return { top: 0 };
  },
});

/**
 * Super Admin Protected Route Guard
 * Authoritatively separates Platform Super Admin routes from Tenant/User routes
 */
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const isSuperAdminRoute = Boolean(to.meta.superAdmin || to.path.startsWith('/super-admin'));

  // Staff pages and Super Admin pages use separate sessions. Access Denied and
  // Page Not Found ('auto' layout) stay on the side the user came from.
  if (to.meta.layout !== 'auto') setActiveContext(contextForPath(to.path));

  // Start downloading the page and its layout now, in parallel with the
  // session check below, instead of after it.
  prefetchRoute(to);

  // Verify the stored session/permissions with the server once per page load.
  // While the saved session is still valid the page is shown straight away and
  // the check runs in the background (the API checks every request anyway); a
  // rejected session or a lost permission then moves the user on. Otherwise the
  // check is awaited so the guards below decide on server data.
  let sessionEnded = false;
  if (auth.token && !auth.verified) {
    const { expiresAt } = getSession();
    const stillValid = Boolean(expiresAt) && expiresAt - Date.now() > 60_000;
    if (stillValid && !to.meta.public) {
      verifyInBackground();
    } else {
      await auth.ensureVerified();
      sessionEnded = !auth.token; // the stored session was rejected by the server
    }
  }

  // 1. Handling Public Routes
  if (to.meta.public) {
    // Already signed in on this side: skip the sign-in page.
    if (to.name === 'login' && auth.isAuthenticated && !auth.isSuperAdmin) {
      return { path: safeRedirect(to.query.redirect, '/dashboard'), replace: true };
    }
    if (to.name === 'super-admin-login' && auth.isAuthenticated && auth.isSuperAdmin) {
      const target = safeRedirect(to.query.redirect, '/super-admin/dashboard');
      return { path: target.startsWith('/super-admin') ? target : '/super-admin/dashboard', replace: true };
    }
    return true;
  }

  const loginQuery = sessionEnded ? { redirect: to.fullPath, expired: 'true' } : { redirect: to.fullPath };

  // 2. Strict Super Admin Protection Guard
  if (isSuperAdminRoute) {
    // Unauthenticated user requesting Super Admin route -> redirect to Super Admin login
    if (!auth.isAuthenticated) {
      return {
        name: 'super-admin-login',
        query: loginQuery,
        replace: true,
      };
    }

    // Only a Super Admin account may hold a Super Admin-side session.
    if (!auth.isSuperAdmin) {
      auth.clearSession('super_admin');
      return { name: 'super-admin-login', query: { redirect: to.fullPath }, replace: true };
    }

    // Authenticated Super Admin allowed
    return true;
  }

  // 3. Normal Authenticated Routes Guard
  if (!auth.isAuthenticated) {
    return { name: 'login', query: loginQuery, replace: true };
  }

  // Super Admin accounts sign in only on the Super Admin side.
  if (auth.isSuperAdmin) {
    auth.clearSession('user');
    return { name: 'login', query: { redirect: to.fullPath }, replace: true };
  }

  // Enforce granular route permissions via replace: true to prevent history trapping
  if (to.meta.permission && !auth.can(to.meta.permission)) {
    return { name: 'forbidden', query: { from: to.fullPath }, replace: true };
  }
  if (to.meta.anyOf && !auth.canAny(...to.meta.anyOf)) {
    return { name: 'forbidden', query: { from: to.fullPath }, replace: true };
  }

  return true;
});

// A new deployment can invalidate lazily-loaded chunks; reload instead of showing a blank page.
router.onError((err, to) => {
  if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(err?.message || '')) {
    window.location.assign(to.fullPath);
  }
});

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} — Inventory Management System`
    : 'Inventory Management System';
});

export default router;
