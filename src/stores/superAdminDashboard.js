import { defineStore } from 'pinia';
import { ref } from 'vue';
import { superAdminApi } from '@/api';

const TTL_MS = 60_000;

export const useSuperAdminDashboardStore = defineStore('superAdminDashboard', () => {
  const data = ref(null);
  const stats = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const lastFetched = ref(0);

  const invalidate = () => {
    data.value = null;
    stats.value = null;
    lastFetched.value = 0;
    error.value = null;
  };

  const fetchDashboard = async (force = false) => {
    const isFresh = Date.now() - lastFetched.value < TTL_MS;
    if (!force && isFresh && data.value) {
      return { data: data.value, stats: stats.value };
    }

    loading.value = true;
    error.value = null;

    try {
      const [dashRes, statsRes] = await Promise.all([
        superAdminApi.getDashboard(),
        superAdminApi.getStats().catch(() => null),
      ]);
      data.value = dashRes;
      stats.value = statsRes;
      lastFetched.value = Date.now();
      return { data: dashRes, stats: statsRes };
    } catch (e) {
      error.value = e.message || 'Unable to retrieve Super Admin platform metrics.';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    stats,
    loading,
    error,
    lastFetched,
    fetchDashboard,
    invalidate,
  };
});
