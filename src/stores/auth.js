import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, superAdminAuthApi } from '@/api';
import { getSession, setSession, clearSessionStorage, onSessionChange } from '@/api/session';
import { hasPermission } from '@/utils/permissions';
import { useDashboardStore } from './dashboard';
import { useSuperAdminDashboardStore } from './superAdminDashboard';

export const useAuthStore = defineStore('auth', () => {
  const initial = getSession();
  const user      = ref(initial.user);
  const token     = ref(initial.accessToken);
  const loading   = ref(false);
  const error     = ref(null);
  const verified  = ref(false);

  // Mirror token refreshes and other-tab sign-ins/outs into the reactive store.
  onSessionChange((s) => {
    token.value = s.accessToken;
    user.value = s.user;
    if (!s.accessToken) verified.value = false;
  });

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const isSuperAdmin    = computed(() =>
    user.value?.role?.role_code === 'super_admin' || user.value?.isSuperAdmin === true
  );
  const roleCode    = computed(() => user.value?.role?.role_code ?? null);
  const roleName    = computed(() => user.value?.role?.role_name ?? '');
  const permissions = computed(() => user.value?.permissions ?? []);

  // Single-organization deployment: the workspace name is informational only.
  const tenantId    = computed(() => user.value?.tenantId || 'default-org');
  const tenantName  = computed(() => user.value?.tenantName || 'Primary Workspace');

  /** True when the signed-in role holds every listed permission (same rules as the API). */
  const can = (...codes) => {
    if (isSuperAdmin.value) return true;
    return codes.every((c) => hasPermission(permissions.value, c));
  };

  /** True when the signed-in role holds at least one listed permission. */
  const canAny = (...codes) => {
    if (isSuperAdmin.value) return true;
    return codes.some((c) => hasPermission(permissions.value, c));
  };

  const startSession = (result, context) => {
    setSession({
      accessToken: result.session.accessToken,
      refreshToken: result.session.refreshToken || null,
      expiresAt: result.session.expiresAt ? Number(result.session.expiresAt) * 1000 : null,
      context,
      user: result.user,
    });
    verified.value = true;
    verifyAttempted = true;
    try { useDashboardStore().invalidate(); } catch { /* ignore */ }
    try { useSuperAdminDashboardStore().invalidate(); } catch { /* ignore */ }
  };

  /** Normal user sign in */
  const login = async (email, password) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await authApi.login(email, password);
      if (result.user?.isSuperAdmin || result.user?.role?.role_code === 'super_admin') {
        throw new Error('Invalid email or password.');
      }
      startSession(result, 'user');
      return result.user;
    } catch (e) {
      error.value = e.message || 'Invalid email or password.';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /** Dedicated Super Admin sign in */
  const superAdminLogin = async (email, password) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await superAdminAuthApi.login(email, password);
      if (!result.user?.isSuperAdmin && result.user?.role?.role_code !== 'super_admin') {
        throw new Error('Invalid credentials or unauthorized account.');
      }
      startSession(result, 'super_admin');
      return result.user;
    } catch (e) {
      error.value = e.message || 'Invalid credentials or unauthorized account.';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const signOutRemote = async (fn) => {
    const { refreshToken } = getSession();
    try {
      if (token.value) await fn(refreshToken);
    } catch { /* the local session is cleared regardless */ }
    clearSession();
  };

  const logout = () => signOutRemote((rt) => authApi.logout(rt));
  const superAdminLogout = () => signOutRemote((rt) => superAdminAuthApi.logout(rt));

  /**
   * Re-reads profile and permissions from the server, so a tampered
   * localStorage or a role change made by the Super Admin is corrected.
   * Only a real auth failure signs the user out; a network blip does not.
   */
  let verifying = null;
  let verifyAttempted = false;
  const refreshProfile = () => {
    if (!token.value) {
      verified.value = false;
      return Promise.resolve(null);
    }
    if (verifying) return verifying;
    verifying = (async () => {
      try {
        const me = isSuperAdmin.value ? await superAdminAuthApi.me() : await authApi.me();
        setSession({ user: { ...me, id: me.id } });
        verified.value = true;
        return me;
      } catch (e) {
        if (e.status === 401 || e.status === 403) clearSession();
        return null;
      } finally {
        verifying = null;
        verifyAttempted = true;
      }
    })();
    return verifying;
  };

  /**
   * Ensures the profile was verified with the server once per page load.
   * If the server is unreachable we do not block every navigation on it; the
   * API still enforces permissions on every request.
   */
  const ensureVerified = () => {
    if (verified.value || !token.value || verifyAttempted) return Promise.resolve();
    return refreshProfile();
  };

  /** Drops the session locally. Called on sign-out and on a final 401. */
  const clearSession = () => {
    clearSessionStorage();
    verified.value = false;
    try { useDashboardStore().invalidate(); } catch { /* ignore */ }
    try { useSuperAdminDashboardStore().invalidate(); } catch { /* ignore */ }
  };

  return {
    user, token, loading, error, verified,
    isAuthenticated, isSuperAdmin, roleCode, roleName, permissions,
    tenantId, tenantName,
    can, canAny, login, superAdminLogin, logout, superAdminLogout, refreshProfile, ensureVerified, clearSession,
  };
});
