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
      <!-- Shield Lock Icon -->
      <div class="mx-auto h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 grid place-items-center mb-5 text-rose-600 dark:text-rose-400 shadow-sm">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-semibold mb-3">
        <span>Error 403</span>
        <span>·</span>
        <span>No access</span>
      </div>

      <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Access Denied</h1>
      <p class="text-sm text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
        Your account does not have permission to open this page. If you need access, please contact your system administrator.
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
