<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const dashboardRoute = computed(() => {
  return auth.isSuperAdmin ? '/super-admin/dashboard' : '/dashboard';
});

const dashboardLabel = computed(() => {
  return auth.isSuperAdmin ? 'Super Admin Dashboard' : 'Return to Dashboard';
});

const goBack = () => {
  if (window.history.length > 2) {
    router.back();
  } else {
    router.replace(dashboardRoute.value);
  }
};
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center p-4">
    <div class="card p-8 sm:p-12 text-center max-w-lg w-full shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div class="mx-auto h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid place-items-center mb-5 text-slate-600 dark:text-slate-300 shadow-sm font-mono text-xl font-bold">
        404
      </div>

      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-3">
        <span>Page Not Found</span>
      </div>

      <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Page not found</h1>
      <p class="text-sm text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
        The page you are looking for does not exist or may have been moved.
      </p>

      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button type="button" class="btn-ghost w-full sm:w-auto" @click="goBack">
          ← Go Back
        </button>
        <RouterLink :to="dashboardRoute" class="btn-primary w-full sm:w-auto">
          {{ dashboardLabel }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>
