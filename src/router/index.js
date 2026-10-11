import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

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
      title: 'Platform Administration Dashboard',
    },
  },
  {
    path: '/super-admin/users',
    name: 'super-admin-users',
    component: () => import('@/views/super-admin/SuperAdminUsersView.vue'),
    meta: {
      superAdmin: true,
      layout: 'super-admin',
      title: 'Platform Users',
    },
  },
  {
    path: '/super-admin/roles',
    name: 'super-admin-roles',
    component: () => import('@/views/super-admin/SuperAdminRolesView.vue'),
    meta: {
      superAdmin: true,
      layout: 'super-admin',
      title: 'Platform Roles & Permissions',
    },
  },
  {
    path: '/super-admin/tenants',
    name: 'super-admin-tenants',
    component: () => import('@/views/super-admin/SuperAdminTenantsView.vue'),
    meta: {
      superAdmin: true,
      layout: 'super-admin',
      title: 'Client Tenants & Workspaces',
    },
  },
  {
    path: '/super-admin/logs',
    name: 'super-admin-logs',
    component: () => import('@/views/super-admin/SuperAdminLogsView.vue'),
    meta: {
      superAdmin: true,
      layout: 'super-admin',
      title: 'System Audit Logs',
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
    meta: { title: 'Reports & Analytics', permission: 'reports.view' },
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
    meta: { title: 'Roles & Permissions', permission: 'roles.manage' },
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
    meta: { title: 'Financial Records', permission: 'finance.view' },
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
    meta: { title: 'Access Denied' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page Not Found' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

/**
 * Super Admin Protected Route Guard
 * Authoritatively separates Platform Super Admin routes from Tenant/User routes
 */
router.beforeEach((to) => {
  const auth = useAuthStore();
  const isSuperAdminRoute = Boolean(to.meta.superAdmin || to.path.startsWith('/super-admin'));

  // 1. Handling Public Routes
  if (to.meta.public) {
    if (to.name === 'login' && auth.isAuthenticated) {
      if (auth.isSuperAdmin) {
        return { name: 'super-admin-dashboard', replace: true };
      }
      return { name: 'dashboard', replace: true };
    }
    if (to.name === 'super-admin-login' && auth.isAuthenticated && auth.isSuperAdmin) {
      return { name: 'super-admin-dashboard', replace: true };
    }
    return true;
  }

  // 2. Strict Super Admin Protection Guard
  if (isSuperAdminRoute) {
    // Unauthenticated user requesting Super Admin route -> redirect to Super Admin login
    if (!auth.isAuthenticated) {
      return {
        name: 'super-admin-login',
        query: { redirect: to.fullPath },
        replace: true,
      };
    }

    // Authenticated normal user (Admin, Manager, Staff) attempting Super Admin route -> Access Denied
    if (!auth.isSuperAdmin) {
      return { name: 'forbidden', replace: true };
    }

    // Authenticated Super Admin allowed
    return true;
  }

  // 3. Normal Authenticated Routes Guard
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath }, replace: true };
  }

  // Super Admin possessing global administrative clearance across all routes
  if (auth.isSuperAdmin) {
    return true;
  }

  // Enforce granular route permissions via replace: true to prevent history trapping
  if (to.meta.permission && !auth.can(to.meta.permission)) {
    return { name: 'forbidden', replace: true };
  }
  if (to.meta.anyOf && !auth.canAny(...to.meta.anyOf)) {
    return { name: 'forbidden', replace: true };
  }

  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} — Inventory Management System`
    : 'Inventory Management System';
});

export default router;
