<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <div class="border-b border-slate-200 pb-5 dark:border-slate-800">
      <span class="text-xs font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">Platform Administration</span>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
        Super Admin Control Panel
      </h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        System telemetry, tenant isolation oversight, and platform services.
      </p>
    </div>
  </div>
</template>
