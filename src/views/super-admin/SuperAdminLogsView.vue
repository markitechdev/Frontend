<script setup>
import { ref, computed, onMounted } from 'vue';
import { superAdminApi } from '@/api';
import TableSkeleton from '@/components/ui/TableSkeleton.vue';

const logs = ref([]);
const loading = ref(true);
const error = ref(null);

// Filters & Pagination
const search = ref('');
const selectedAction = ref('ALL');
const selectedEntity = ref('ALL');
const currentPage = ref(1);
const pageSize = ref(20);
const totalRecords = ref(0);

// Details Modal
const showDetailsModal = ref(false);
const selectedLog = ref(null);

const actionOptions = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'SUPER_ADMIN_LOGIN', label: '🛡️ SUPER_ADMIN_LOGIN' },
  { value: 'login', label: '🔑 LOGIN' },
  { value: 'logout', label: '🚪 LOGOUT' },
  { value: 'super_admin_login_denied', label: '🚫 SUPER_ADMIN_LOGIN_DENIED' },
  { value: 'USER_CREATED', label: '👤 USER_CREATED' },
  { value: 'USER_UPDATED', label: '✏️ USER_UPDATED' },
  { value: 'USER_ROLE_CHANGED', label: '🔄 USER_ROLE_CHANGED' },
  { value: 'USER_ACTIVATED', label: '✅ USER_ACTIVATED' },
  { value: 'USER_DEACTIVATED', label: '⛔ USER_DEACTIVATED' },
  { value: 'ROLE_CREATED', label: '🏷️ ROLE_CREATED' },
  { value: 'ROLE_UPDATED', label: '⚙️ ROLE_UPDATED' },
  { value: 'ROLE_DELETED', label: '🗑️ ROLE_DELETED' },
  { value: 'ROLE_ASSIGNED', label: '📌 ROLE_ASSIGNED' },
  { value: 'PERMISSION_ADDED', label: '➕ PERMISSION_ADDED' },
  { value: 'USER_PASSWORD_RESET', label: '🔐 USER_PASSWORD_RESET' },
  { value: 'USER_DELETED', label: '🗑️ USER_DELETED' },
];

const entityOptions = [
  { value: 'ALL', label: 'All Entities' },
  { value: 'users', label: 'Users' },
  { value: 'roles', label: 'Roles' },
  { value: 'auth', label: 'Auth & Security' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'suppliers', label: 'Suppliers' },
];

const when = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getActionColor = (action) => {
  const act = String(action || '').toUpperCase();
  if (act.includes('SUPER_ADMIN')) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';
  }
  if (act.includes('CREATED') || act.includes('ACTIVATED') || act.includes('ADDED')) {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
  }
  if (act.includes('DELETED') || act.includes('DEACTIVATED') || act.includes('REMOVED')) {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
  }
  if (act.includes('ROLE_CHANGED') || act.includes('ASSIGNED')) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
  }
  if (act.includes('UPDATED')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
  }
  return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
};

const fetchLogs = async () => {
  loading.value = true;
  error.value = null;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
    };
    if (selectedAction.value !== 'ALL') params.action = selectedAction.value;
    if (selectedEntity.value !== 'ALL') params.entityType = selectedEntity.value;
    if (search.value.trim()) params.search = search.value.trim();

    const res = await superAdminApi.logs.list(params);
    if (Array.isArray(res)) {
      logs.value = res;
      totalRecords.value = res.length;
    } else if (res?.data) {
      logs.value = res.data;
      totalRecords.value = res.meta?.total || res.data.length;
    } else {
      logs.value = [];
      totalRecords.value = 0;
    }
  } catch (e) {
    error.value = e.message || 'Unable to retrieve platform audit journal.';
  } finally {
    loading.value = false;
  }
};

const openDetails = (log) => {
  selectedLog.value = log;
  showDetailsModal.value = true;
};

const totalPages = computed(() => {
  return Math.max(1, Math.ceil((totalRecords.value || 1) / pageSize.value));
});

const onFilterChange = () => {
  currentPage.value = 1;
  fetchLogs();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchLogs();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchLogs();
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
            Security & Governance
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Immutable Audit Journal
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Platform System Audit Logs
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Permanent chronological journal of platform security events, user governance, and role permissions.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="fetchLogs"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
        >
          <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin text-indigo-600' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Journal</span>
        </button>
      </div>
    </div>

    <!-- Error Alert with Retry -->
    <div
      v-if="error"
      class="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

    <!-- Main Table Container -->
    <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <!-- Toolbar -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <!-- Search box -->
          <div class="relative w-full sm:w-64">
            <input
              v-model="search"
              @keyup.enter="onFilterChange"
              type="search"
              placeholder="Filter by keyword, actor..."
              class="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Action Dropdown -->
          <select
            v-model="selectedAction"
            @change="onFilterChange"
            class="w-full sm:w-auto text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="act in actionOptions" :key="act.value" :value="act.value">
              {{ act.label }}
            </option>
          </select>

          <!-- Entity Dropdown -->
          <select
            v-model="selectedEntity"
            @change="onFilterChange"
            class="w-full sm:w-auto text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="ent in entityOptions" :key="ent.value" :value="ent.value">
              {{ ent.label }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{{ loading ? 'Querying records...' : `${totalRecords} audit events persisted` }}</span>
        </div>
      </div>

      <TableSkeleton v-if="loading" :rows="6" :cols="6" class="p-4" />

      <div v-else-if="!logs.length" class="py-16 text-center text-slate-400 text-xs">
        <p class="font-semibold text-sm">No audit journal records found</p>
        <p class="mt-1">Try clearing or adjusting search filters.</p>
      </div>

      <!-- Logs Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th class="py-3 px-4 font-semibold">Date / Time</th>
              <th class="py-3 px-4 font-semibold">Actor</th>
              <th class="py-3 px-4 font-semibold">Action</th>
              <th class="py-3 px-4 font-semibold">Resource / Target</th>
              <th class="py-3 px-4 font-semibold">Summary Details</th>
              <th class="py-3 px-4 font-semibold text-right">Details</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="log in logs"
              :key="log.logId || log.log_id || log.id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {{ when(log.createdAt || log.created_at || log.timestamp) }}
              </td>

              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm">{{ log.actor?.icon || '👤' }}</span>
                  <div>
                    <p class="font-semibold text-slate-900 dark:text-white leading-tight">
                      {{ log.actor?.fullName || log.user?.full_name || log.user?.username || 'System' }}
                    </p>
                    <p class="text-[10px] text-slate-400">
                      {{ log.actor?.roleName || log.actor?.roleCode || 'Super Admin' }}
                    </p>
                  </div>
                </div>
              </td>

              <td class="py-3 px-4">
                <span
                  :class="['inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border tracking-wide', getActionColor(log.action)]"
                >
                  {{ log.action }}
                </span>
              </td>

              <td class="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ log.entityType || log.entity_type }}</span>
                <span v-if="log.entityId || log.entity_id" class="text-slate-400 ml-1">#{{ String(log.entityId || log.entity_id).slice(0, 8) }}</span>
              </td>

              <td class="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                {{ log.details ? JSON.stringify(log.details) : '—' }}
              </td>

              <td class="py-3 px-4 text-right">
                <button
                  type="button"
                  @click="openDetails(log)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Payload</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          Page <span class="font-bold text-slate-700 dark:text-slate-300">{{ currentPage }}</span> of <span class="font-bold text-slate-700 dark:text-slate-300">{{ totalPages }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="prevPage"
            :disabled="currentPage <= 1 || loading"
            class="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Previous
          </button>
          <button
            type="button"
            @click="nextPage"
            :disabled="currentPage >= totalPages || loading"
            class="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- LOG DETAILS MODAL -->
    <div
      v-if="showDetailsModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <div class="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">📜</span>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Audit Event Details</h2>
          </div>
          <button @click="showDetailsModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <div class="text-xs space-y-3">
          <div class="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div>
              <p class="text-[10px] text-slate-400 font-semibold uppercase">Action Performed</p>
              <p class="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{{ selectedLog?.action }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-semibold uppercase">Timestamp</p>
              <p class="font-mono text-slate-700 dark:text-slate-300 mt-0.5">{{ when(selectedLog?.createdAt || selectedLog?.created_at) }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-semibold uppercase">Actor / Initiator</p>
              <p class="font-semibold text-slate-900 dark:text-white mt-0.5">
                {{ selectedLog?.actor?.fullName || selectedLog?.user?.full_name || 'System' }}
                <span class="text-slate-400 font-normal">({{ selectedLog?.actor?.roleName || 'Super Admin' }})</span>
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-semibold uppercase">Resource / Entity</p>
              <p class="font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                {{ selectedLog?.entityType || selectedLog?.entity_type }} (ID: {{ selectedLog?.entityId || selectedLog?.entity_id || 'N/A' }})
              </p>
            </div>
          </div>

          <div>
            <p class="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Event Payload & Safe Metadata:
            </p>
            <pre class="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800 leading-relaxed">{{ JSON.stringify(selectedLog?.details || {}, null, 2) }}</pre>
          </div>
        </div>

        <div class="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="showDetailsModal = false"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
