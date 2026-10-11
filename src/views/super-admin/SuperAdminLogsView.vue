<script setup>
import { ref, onMounted } from 'vue';
import { superAdminApi } from '@/api';
import TableSkeleton from '@/components/ui/TableSkeleton.vue';

const logs = ref([]);
const loading = ref(true);
const error = ref(null);

const when = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const fetchLogs = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await superAdminApi.logs.list();
    logs.value = Array.isArray(res) ? res : res?.data || res?.logs || [];
  } catch (e) {
    error.value = e.message || 'Unable to retrieve platform audit journal.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchLogs);
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            Security & Compliance
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Immutable Audit Trail
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Platform System Audit Logs
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Chronological journal of authentication events, authorization checks, and sensitive data changes.
        </p>
      </div>

      <button
        type="button"
        @click="fetchLogs"
        :disabled="loading"
        class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-xs"
      >
        <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin text-indigo-600' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh Journal</span>
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
        @click="fetchLogs"
        class="px-3 py-1 text-xs font-bold uppercase rounded bg-rose-600 text-white hover:bg-rose-700 transition"
      >
        Retry
      </button>
    </div>

    <TableSkeleton v-if="loading" :rows="6" :cols="5" class="p-4 bg-white dark:bg-slate-900 rounded-xl" />

    <!-- Logs Table -->
    <div v-else class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div v-if="!logs.length" class="py-16 text-center text-slate-400 text-xs">
        No audit entries recorded yet.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-3 px-4 font-semibold">Event Timestamp</th>
              <th class="py-3 px-4 font-semibold">Actor / User</th>
              <th class="py-3 px-4 font-semibold">Action Performed</th>
              <th class="py-3 px-4 font-semibold">Entity Type</th>
              <th class="py-3 px-4 font-semibold text-right">Scope</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="log in logs"
              :key="log.log_id || log.id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                {{ when(log.created_at || log.timestamp) }}
              </td>
              <td class="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                {{ log.user?.full_name || log.user_name || log.user_id || 'System' }}
              </td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {{ log.action }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                {{ log.entity_type || 'platform' }}
              </td>
              <td class="py-3 px-4 text-right">
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  Platform
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
