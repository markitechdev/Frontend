import { defineStore } from 'pinia';
import { ref } from 'vue';
import { dashboardApi } from '@/api';
import { useAuthStore } from './auth';

const TTL_MS = 60_000; // 60 seconds TTL

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const lastFetched = ref(0);
  const cachedTenantId = ref(null);
  const cachedUserId = ref(null);

  const invalidate = () => {
    data.value = null;
    lastFetched.value = 0;
    cachedTenantId.value = null;
    cachedUserId.value = null;
    error.value = null;
  };

  const fetchDashboard = async (force = false) => {
    const auth = useAuthStore();
    const currentTenant = auth.tenantId;
    const currentUserId = auth.user?.id || auth.user?.userId;
    const isFresh = Date.now() - lastFetched.value < TTL_MS;
    const isSameContext = cachedTenantId.value === currentTenant && cachedUserId.value === currentUserId;

    // Cache hit: tenant-safe, non-expired data
    if (!force && isFresh && isSameContext && data.value) {
      return data.value;
    }

    loading.value = true;
    error.value = null;

    try {
      const res = await dashboardApi.get();
      data.value = res;
      lastFetched.value = Date.now();
      cachedTenantId.value = currentTenant;
      cachedUserId.value = currentUserId;
      return res;
    } catch (e) {
      error.value = e.message || 'Unable to retrieve dashboard metrics.';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    loading,
    error,
    lastFetched,
    fetchDashboard,
    invalidate,
  };
});
