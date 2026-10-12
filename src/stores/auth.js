import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import { authApi, superAdminAuthApi } from '@/api';
import { getSession, setSession, clearSessionStorage, onSessionChange, getActiveContext } from '@/api/session';
import { hasPermission } from '@/utils/permissions';
import { useDashboardStore } from './dashboard';
import { useSuperAdminDashboardStore } from './superAdminDashboard';

export const useAuthStore = defineStore('auth', () => {
  // The store always shows the session of the side on screen: the staff side
  // or the Super Admin side (see api/session.js). Each side signs in and out
  // on its own.
  const initial = getSession();
  const context   = ref(initial.context);
  const user      = ref(initial.user);
  const token     = ref(initial.accessToken);
  const loading   = ref(false);
  const error     = ref(null);

  // Server check of the stored profile, tracked per side and once per page load.
  const verifiedBy  = reactive({ user: false, super_admin: false });
  const attemptedBy = { user: false, super_admin: false };
  const verified = computed(() => verifiedBy[context.value]);

  // Mirror sign-ins/outs, token refreshes, other tabs and side switches.
  onSessionChange((s) => {
    if (s.context !== context.value) error.value = null; // a login error belongs to the page it happened on
    context.value = s.context;
    token.value = s.accessToken;
    user.value = s.user;
    if (!s.accessToken) {
      verifiedBy[s.context] = false;
      attemptedBy[s.context] = false;
    }
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

  const startSession = (result, ctx) => {
    setSession({
      accessToken: result.session.accessToken,
      refreshToken: result.session.refreshToken || null,
      expiresAt: result.session.expiresAt ? Number(result.session.expiresAt) * 1000 : null,
      user: result.user,
    }, ctx);
    verifiedBy[ctx] = true;
    attemptedBy[ctx] = true;
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

  const signOutRemote = async (fn, ctx) => {
    const { accessToken, refreshToken } = getSession(ctx);
    try {
      if (accessToken) await fn(refreshToken);
    } catch { /* the local session is cleared regardless */ }
    clearSession(ctx);
  };

  // Each sign-out ends only its own side's session.
  const logout = () => signOutRemote((rt) => authApi.logout(rt), 'user');
  const superAdminLogout = () => signOutRemote((rt) => superAdminAuthApi.logout(rt), 'super_admin');

  /**
   * Re-reads profile and permissions from the server, so a tampered
   * localStorage or a role change made by the Super Admin is corrected.
   * Only a real auth failure signs the user out; a network blip does not.
   */
  const verifying = { user: null, super_admin: null };
  const refreshProfile = () => {
    const ctx = getActiveContext();
    if (!getSession(ctx).accessToken) {
      verifiedBy[ctx] = false;
      return Promise.resolve(null);
    }
    if (verifying[ctx]) return verifying[ctx];
    verifying[ctx] = (async () => {
      try {
        const me = ctx === 'super_admin' ? await superAdminAuthApi.me() : await authApi.me();
        const isSA = me?.isSuperAdmin === true || me?.role?.role_code === 'super_admin';
        // A session may only be used on its own side.
        if (isSA !== (ctx === 'super_admin')) {
          clearSession(ctx);
          return null;
        }
        setSession({ user: { ...me, id: me.id } }, ctx);
        verifiedBy[ctx] = true;
        return me;
      } catch (e) {
        if (e.status === 401 || e.status === 403) clearSession(ctx);
        return null;
      } finally {
        verifying[ctx] = null;
        attemptedBy[ctx] = true;
      }
    })();
    return verifying[ctx];
  };

  /**
   * Ensures the profile was verified with the server once per page load.
   * If the server is unreachable we do not block every navigation on it; the
   * API still enforces permissions on every request.
   */
  const ensureVerified = () => {
    const ctx = getActiveContext();
    if (verifiedBy[ctx] || !getSession(ctx).accessToken || attemptedBy[ctx]) return Promise.resolve();
    return refreshProfile();
  };

  /** Drops the session locally. Called on sign-out and on a final 401. */
  const clearSession = (ctx = getActiveContext()) => {
    clearSessionStorage(ctx);
    verifiedBy[ctx] = false;
    try { useDashboardStore().invalidate(); } catch { /* ignore */ }
    try { useSuperAdminDashboardStore().invalidate(); } catch { /* ignore */ }
  };

  return {
    user, token, loading, error, verified, context,
    isAuthenticated, isSuperAdmin, roleCode, roleName, permissions,
    tenantId, tenantName,
    can, canAny, login, superAdminLogin, logout, superAdminLogout, refreshProfile, ensureVerified, clearSession,
  };
});
