<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

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
      <div class="mx-auto h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center mb-5 text-slate-600 shadow-sm font-mono text-xl font-bold">
        404
      </div>

      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
        <span>Page Not Found</span>
      </div>

      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Resource Not Found</h1>
      <p class="text-sm text-slate-600 mt-2.5 leading-relaxed">
        The requested URL does not match any registered route or has been moved within the system.
      </p>

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
