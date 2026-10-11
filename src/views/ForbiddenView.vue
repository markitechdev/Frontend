<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const goBack = () => {
  if (window.history.length > 2) {
    router.back();
  } else {
    router.replace({ name: 'dashboard' });
  }
};
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center p-4">
    <div class="card p-8 sm:p-12 text-center max-w-lg w-full shadow-lg border-slate-200">
      <div class="mx-auto h-16 w-16 rounded-2xl bg-red-50 border border-red-200 grid place-items-center mb-5 text-red-600 shadow-sm">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold mb-3">
        <span>HTTP 403</span>
        <span>·</span>
        <span>Permission Denied</span>
      </div>

      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
      <p class="text-sm text-slate-600 mt-2.5 leading-relaxed">
        Your current role (<span class="font-semibold text-slate-800">{{ auth.roleName || 'Staff' }}</span>) does not possess the authorized permissions to access this administrative module or dataset.
      </p>

      <div class="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-200">
        Active Workspace: <strong class="text-slate-700">{{ auth.tenantName }}</strong>
      </div>

      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button type="button" class="btn-ghost w-full sm:w-auto" @click="goBack">
          ← Go Back
        </button>
        <RouterLink to="/dashboard" class="btn-primary w-full sm:w-auto">
          Return to Dashboard
        </RouterLink>
      </div>
    </div>
  </div>
</template>
