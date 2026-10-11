<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { movementsApi } from '@/api';
import { useToastStore } from '@/stores/toast';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const toast = useToastStore();

const rows = ref([]);
const summary = ref(null);
const loading = ref(true);
const filters = reactive({ type: '', from: '', to: '' });

const when = (d) => new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const peso = (n) => (n === null || n === undefined || n === '') ? '--' : `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const load = async () => {
  loading.value = true;
  try {
    const [list, sum] = await Promise.all([
      movementsApi.list({ type: filters.type, from: filters.from || undefined, to: filters.to || undefined, limit: 200 }),
      movementsApi.summary({ from: filters.from || undefined, to: filters.to || undefined }),
    ]);
    rows.value = list.data;
    summary.value = sum;
  } catch (e) { toast.error(e.message); }
  finally { loading.value = false; }
};

watch(() => [filters.type, filters.from, filters.to], load);
onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <!-- View Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold tracking-widest text-sky-600 uppercase">
            Audit Ledger
          </span>
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            Immutable Movements
          </span>
        </div>
        <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
          Stock Movement Ledger
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Audited log of inbound receipts, dispatches, write-offs, and cycle adjustments.
        </p>
      </div>

      <button
        type="button"
        class="btn-ghost btn-sm"
        :disabled="loading"
        @click="load"
      >
        <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin text-sky-600' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh Ledger</span>
      </button>
    </div>

    <!-- Movement Operational Metrics -->
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <div class="card p-4 border-l-4 border-l-sky-500">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Transactions</span>
        <p class="text-2xl font-black text-slate-900 mt-1">{{ summary ? (summary.totalMovements ?? 0) : '--' }}</p>
        <p class="text-[11px] text-slate-500 mt-0.5">Recorded operations</p>
      </div>

      <div class="card p-4 border-l-4 border-l-emerald-500">
        <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Inbound Receipts</span>
        <p class="text-2xl font-black text-slate-900 mt-1">{{ summary ? (summary.byType?.stock_in?.units ?? 0) : '--' }}</p>
        <p class="text-[11px] text-slate-500 mt-0.5">Physical units received</p>
      </div>

      <div class="card p-4 border-l-4 border-l-blue-500">
        <span class="text-[10px] font-bold uppercase tracking-wider text-blue-700">Outbound Dispatched</span>
        <p class="text-2xl font-black text-slate-900 mt-1">{{ summary ? (summary.byType?.stock_out?.units ?? 0) : '--' }}</p>
        <p class="text-[11px] text-slate-500 mt-0.5">Physical units issued</p>
      </div>

      <div class="card p-4 border-l-4 border-l-rose-500">
        <span class="text-[10px] font-bold uppercase tracking-wider text-rose-700">Damaged &amp; Missing</span>
        <p class="text-2xl font-black text-slate-900 mt-1">{{ summary ? (summary.shrinkage?.units ?? 0) : '--' }}</p>
        <p class="text-[11px] text-slate-500 mt-0.5">
          {{ summary?.shrinkage?.value != null ? `${peso(summary.shrinkage.value)} write-off` : 'Shrinkage loss' }}
        </p>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="card p-4 flex flex-wrap items-center gap-3">
      <select v-model="filters.type" class="select w-auto min-w-[190px]">
        <option value="">All Movement Types</option>
        <option value="stock_in">📥 Stock In — Received</option>
        <option value="stock_out">📤 Stock Out — Dispatched</option>
        <option value="returned">↩️ Returned — To Shelf</option>
        <option value="damaged">⚠️ Damaged — Written Off</option>
        <option value="missing">🔍 Missing — Discrepancy</option>
        <option value="adjustment">🛠 Adjustment — Correction</option>
      </select>

      <div class="flex items-center gap-2 text-xs">
        <label class="font-bold text-slate-600">From:</label>
        <input v-model="filters.from" type="date" class="input w-auto" />
      </div>

      <div class="flex items-center gap-2 text-xs">
        <label class="font-bold text-slate-600">To:</label>
        <input v-model="filters.to" type="date" class="input w-auto" />
      </div>

      <button
        v-if="filters.type || filters.from || filters.to"
        class="btn-ghost btn-sm"
        @click="filters.type=''; filters.from=''; filters.to=''"
      >
        Clear Filters
      </button>

      <span class="ml-auto text-xs font-semibold text-slate-500">
        {{ loading ? '-- record(s)' : `${rows.length} ledger record(s)` }}
      </span>
    </div>

    <!-- Movement Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Product Details</th>
              <th>Classification</th>
              <th class="text-right">Quantity</th>
              <th>Reference / PO</th>
              <th>Operational Notes</th>
              <th>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-14 text-slate-400 font-medium">Loading ledger transactions…</td>
            </tr>
            <tr v-else-if="!rows.length">
              <td colspan="7" class="text-center py-14 text-slate-400 font-medium">No ledger records match the selected parameters.</td>
            </tr>
            <tr v-else v-for="m in rows" :key="m.movement_id" class="hover:bg-slate-50/80 transition-colors">
              <td class="font-mono text-xs text-slate-600 whitespace-nowrap">
                {{ when(m.date_recorded) }}
              </td>
              <td>
                <p class="font-bold text-slate-900 leading-tight">{{ m.product?.product_name }}</p>
                <p class="text-[11px] text-slate-500 font-mono">SKU: {{ m.product?.sku }}</p>
              </td>
              <td>
                <StatusBadge :status="m.movement_type" />
              </td>
              <td class="text-right font-black tabular-nums text-sm text-slate-900">
                {{ m.movement_type === 'stock_out' || m.movement_type === 'damaged' || m.movement_type === 'missing' ? '-' : '+' }}{{ Math.abs(m.quantity) }}
              </td>
              <td class="font-mono text-xs text-slate-600">
                {{ m.reference_no || '—' }}
              </td>
              <td class="text-xs text-slate-600 max-w-xs truncate">
                {{ m.reason || '—' }}
              </td>
              <td class="text-xs font-semibold text-slate-700">
                {{ m.recorded_by_user?.full_name || 'System Operator' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
