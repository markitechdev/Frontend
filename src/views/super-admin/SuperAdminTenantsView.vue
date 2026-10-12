<script setup>
import { ref, onMounted } from 'vue';
import { superAdminApi } from '@/api';
import TableSkeleton from '@/components/ui/TableSkeleton.vue';

const tenants = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchTenants = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await superAdminApi.getTenants();
    tenants.value = Array.isArray(res) ? res : [];
  } catch (e) {
    error.value = e.message || 'Unable to retrieve client tenants.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchTenants);
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            Multi-Tenancy Infrastructure
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Strict Partitioning Active
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Client Tenants & Workspaces
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Partition boundaries, tenant isolation policies, and enterprise subscriptions.
        </p>
      </div>

      <button
        type="button"
        @click="fetchTenants"
        :disabled="loading"
        class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-xs"
      >
        <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin text-indigo-600' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh Tenants</span>
      </button>
    </div>

    <!-- Error Alert with Retry -->
    <div
      v-if="error"
      class="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="text-sm font-medium text-rose-800 dark:text-rose-200">{{ error }}</span>
      </div>
      <button
        type="button"
        @click="fetchTenants"
        class="px-3 py-1 text-xs font-bold uppercase rounded bg-rose-600 text-white hover:bg-rose-700 transition"
      >
        Retry
      </button>
    </div>

    <TableSkeleton v-if="loading" :rows="3" :cols="4" class="p-4 bg-white dark:bg-slate-900 rounded-xl" />

    <!-- Tenants Table -->
    <div v-else class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <p class="px-4 py-3 text-[11px] text-amber-800 bg-amber-50 border-b border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900">
        This deployment runs as a single organization: every account and record belongs to this one workspace.
        Separate client workspaces need an organizations table and per-organization scoping on every query.
      </p>
      <div v-if="!tenants.length" class="py-16 text-center text-slate-400 text-xs">No client workspaces registered yet.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-3 px-4 font-semibold">Workspace Name</th>
              <th class="py-3 px-4 font-semibold">Tenant ID</th>
              <th class="py-3 px-4 font-semibold">Subscription Plan</th>
              <th class="py-3 px-4 font-semibold text-right">Users (active)</th>
              <th class="py-3 px-4 font-semibold text-right">Products</th>
              <th class="py-3 px-4 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="t in tenants"
              :key="t.tenantId"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">
                {{ t.tenantName }}
              </td>
              <td class="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                {{ t.tenantId }}
              </td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  {{ t.plan }}
                </span>
              </td>
              <td class="py-3 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                {{ t.totalUsers ?? '—' }} <span class="text-slate-400">({{ t.activeUsers ?? '—' }})</span>
              </td>
              <td class="py-3 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">{{ t.totalProducts ?? '—' }}</td>
              <td class="py-3 px-4 text-right">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {{ t.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
