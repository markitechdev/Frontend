import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, superAdminAuthApi } from '@/api';
import { useDashboardStore } from './dashboard';

const TOKEN_KEY = 'ims_access_token';
const USER_KEY  = 'ims_user';

export const useAuthStore = defineStore('auth', () => {
  const user      = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
  const token     = ref(localStorage.getItem(TOKEN_KEY) || null);
  const loading   = ref(false);
  const error     = ref(null);
  const verified  = ref(false);

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const isSuperAdmin    = computed(() =>
    user.value?.role?.role_code === 'super_admin' || user.value?.isSuperAdmin === true
  );
  const roleCode    = computed(() => user.value?.role?.role_code ?? null);
  const roleName    = computed(() => user.value?.role?.role_name ?? '');
  const permissions = computed(() => user.value?.permissions ?? []);

  // SaaS Tenant & Account boundaries
  const tenantId    = computed(() => user.value?.tenantId || user.value?.organizationId || 'default-org');
  const tenantName  = computed(() => user.value?.tenantName || user.value?.organizationName || 'Primary Workspace');

  /** True when the signed-in role holds every listed permission or is Super Admin. */
  const can = (...codes) => {
    if (isSuperAdmin.value) return true;
    return codes.every((c) => permissions.value.includes(c));
  };

  /** True when the signed-in role holds at least one listed permission or is Super Admin. */
  const canAny = (...codes) => {
    if (isSuperAdmin.value) return true;
    return codes.some((c) => permissions.value.includes(c));
  };

  const persist = (nextUser, nextToken) => {
    user.value = nextUser;
    token.value = nextToken;
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
    else localStorage.removeItem(TOKEN_KEY);
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(USER_KEY);
  };

  const login = async (email, password) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await authApi.login(email, password);
      persist(result.user, result.session.accessToken);
      verified.value = true;
      return result.user;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try { if (token.value) await authApi.logout(); } catch { /* ignore */ }
    persist(null, null);
    verified.value = false;
    useDashboardStore().invalidate();
  };

  /** Re-reads profile from server to guarantee true verified claims and prevent client-side tampering. */
  const refreshProfile = async () => {
    if (!token.value) {
      verified.value = false;
      return null;
    }
    try {
      const me = await authApi.me();
      persist({ ...me, id: me.id }, token.value);
      verified.value = true;
      return me;
    } catch {
      persist(null, null);
      verified.value = false;
      return null;
    }
  };

  /** Drops session locally. Called on sign-out and on 401. */
  const clearSession = () => {
    persist(null, null);
    verified.value = false;
    useDashboardStore().invalidate();
  };


  const superAdminLogin = async (email, password) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await superAdminAuthApi.login(email, password);
      if (!result.user?.isSuperAdmin && result.user?.role?.role_code !== 'super_admin') {
        throw new Error('Access denied: Account is not an authorized Super Admin.');
      }
      persist(result.user, result.session.accessToken);
      verified.value = true;
      return result.user;
    } catch (e) {
      error.value = e.message || 'Unable to authenticate with this login.';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const superAdminLogout = async () => {
    try {
      if (token.value) await superAdminAuthApi.logout();
    } catch {
      /* ignore */
    }
    persist(null, null);
    verified.value = false;
    useDashboardStore().invalidate();
  };

  return {
    user, token, loading, error, verified,
    isAuthenticated, isSuperAdmin, roleCode, roleName, permissions,
    tenantId, tenantName,
    can, canAny, login, superAdminLogin, logout, superAdminLogout, refreshProfile, clearSession,
  };
});
