<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { logsApi } from '@/api';
import { actionLabel, entityLabel, detailsSummary } from '@/utils/auditLabels';

const rows = ref([]);
const loading = ref(true);
const loadError = ref('');
const filters = reactive({ action: '', entityType: '' });
const page = ref(1);
const pageSize = 50;
const pagination = ref(null);

const when = (d) => new Date(d).toLocaleString('en-PH', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
});

let requestSeq = 0;
const load = async () => {
  const seq = ++requestSeq;
  loading.value = true;
  loadError.value = '';
  try {
    const res = await logsApi.list({
      action: filters.action, entityType: filters.entityType, page: page.value, limit: pageSize,
    });
    if (seq !== requestSeq) return;
    rows.value = res.data || [];
    pagination.value = res.pagination;
  } catch (e) {
    if (seq === requestSeq) loadError.value = e.message;
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
};

const goTo = (p) => { page.value = p; load(); };
watch(() => [filters.action, filters.entityType], () => { page.value = 1; load(); });
onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <div class="card p-4 flex flex-wrap items-center gap-3">
      <select v-model="filters.entityType" class="select w-auto min-w-[170px]">
        <option value="">All areas</option>
        <option value="auth">Sign-ins</option>
        <option value="reports">Reports</option>
        <option value="products">Products</option>
        <option value="inventory">Inventory</option>
        <option value="stock_movements">Stock Movements</option>
        <option value="alerts">Alerts</option>
        <option value="suppliers">Suppliers</option>
        <option value="users">Users</option>
        <option value="roles">Roles</option>
      </select>
      <button class="btn-ghost btn-sm" @click="filters.action=''; filters.entityType=''">Clear</button>
      <button class="btn-ghost btn-sm ml-auto" :disabled="loading" @click="load">Refresh</button>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">System Activity Log</h2>
        <span class="text-xs text-slate-400">{{ loading ? '-- entries' : `${pagination?.total ?? rows.length} entries (most recent first)` }}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Area</th><th>Details</th></tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="text-center py-12 text-slate-400">Loading activity…</td></tr>
            <tr v-else-if="loadError">
              <td colspan="6" class="text-center py-10">
                <p class="text-sm text-red-600">{{ loadError }}</p>
                <button class="btn-ghost btn-sm mt-2" @click="load">Try again</button>
              </td>
            </tr>
            <tr v-else-if="!rows.length"><td colspan="6" class="text-center py-12 text-slate-400">No activity recorded{{ filters.entityType ? ' for this area' : '' }}.</td></tr>
            <tr v-else v-for="log in rows" :key="log.logId">
              <td class="text-xs text-slate-500 whitespace-nowrap">{{ when(log.createdAt) }}</td>
              <td class="text-sm font-medium text-slate-700">{{ log.actor?.fullName || 'System' }}</td>
              <td class="text-xs text-slate-500">{{ log.actor?.icon }} {{ log.actor?.roleName || '—' }}</td>
              <td><span class="badge-gray whitespace-nowrap" :title="log.action">{{ actionLabel(log.action) }}</span></td>
              <td class="text-sm text-slate-600">{{ log.entityType ? entityLabel(log.entityType) : '—' }}</td>
              <td class="text-xs text-slate-500 max-w-xs truncate" :title="detailsSummary(log.details)">
                {{ detailsSummary(log.details) || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
        <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
        <div class="flex gap-2">
          <button class="btn-ghost btn-sm" :disabled="loading || !pagination.hasPrev" @click="goTo(page - 1)">Previous</button>
          <button class="btn-ghost btn-sm" :disabled="loading || !pagination.hasNext" @click="goTo(page + 1)">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>
