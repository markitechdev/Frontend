<script setup>
import { ref, onMounted, computed } from 'vue';
import { reportsApi } from '@/api';
import StatCard from '@/components/ui/StatCard.vue';

// Uses /api/reports/* (reports.view). The previous version called
// /movements/summary, which Finance Admin has no permission for, so the whole
// page was redirected to Access Denied.
const summary = ref(null);
const rows = ref([]);
const shrink = ref(null);
const loading = ref(true);
const error = ref('');

const peso = (n) => (n === null || n === undefined || n === '') ? '--' : `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pesoShort = (n) => (n === null || n === undefined || n === '') ? '--' : `₱${Math.round(Number(n)).toLocaleString('en-PH')}`;
const num = (n) => (n === null || n === undefined || n === '') ? '--' : Number(n).toLocaleString();

const topByValue = computed(() => [...rows.value].sort((a, b) => b.totalValue - a.totalValue).slice(0, 10));

const capitalAtRisk = computed(() => rows.value
  .filter((r) => r.stockStatus === 'low_stock' || r.stockStatus === 'out_of_stock')
  .reduce((s, r) => s + r.totalValue, 0));

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [inv, shr] = await Promise.all([reportsApi.inventorySummary({}), reportsApi.shrinkage({})]);
    rows.value = inv.data || [];
    summary.value = inv.meta?.summary || null;
    shrink.value = shr.meta?.summary || null;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <!-- Honest scope note rather than fabricated sales figures. -->
    <div class="card p-4 border-l-4 border-l-amber-400 bg-amber-50/50">
      <p class="text-sm font-semibold text-slate-800">Finance Admin — partial scope</p>
      <p class="text-sm text-slate-600 mt-1">
        Inventory valuation and shrinkage cost below are live from the database.
        <span class="font-medium">Sales and transaction management, financial records and
        advanced financial reports</span> are scheduled for the finals phase — they need
        <code class="text-xs bg-white px-1 py-0.5 rounded">transactions</code> and
        <code class="text-xs bg-white px-1 py-0.5 rounded">sales</code> tables that the prelim
        data architecture did not yet define.
      </p>
    </div>

    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard label="Inventory Valuation" :value="loading ? '--' : pesoShort(summary?.totalValuation)" sublabel="At current unit prices" tone="green" />
      <StatCard label="Total Units" :value="loading ? '--' : num(summary?.totalUnits)" tone="blue" />
      <StatCard label="Capital in Low / Out of Stock" :value="loading ? '--' : pesoShort(capitalAtRisk)" :sublabel="loading ? '' : `${num((summary?.lowStockCount || 0) + (summary?.outOfStockCount || 0))} item(s) at risk`" tone="amber" />
      <StatCard label="Shrinkage Loss" :value="loading ? '--' : pesoShort(shrink?.totalShrinkageValue)" :sublabel="shrink ? `${num(shrink.totalShrinkageUnits)} units written off` : ''" tone="red" />
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Highest-Value Inventory Holdings</h2>
        <RouterLink to="/reports" class="text-xs font-medium text-navy-600 hover:underline">Full report</RouterLink>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr><th>SKU</th><th>Product</th><th class="text-right">Units</th>
                <th class="text-right">Unit Price</th><th class="text-right">Total Value</th></tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="5" class="text-center py-12 text-slate-400">Loading…</td></tr>
            <tr v-else-if="error">
              <td colspan="5" class="text-center py-10">
                <p class="text-sm text-red-600">{{ error }}</p>
                <button class="btn-ghost btn-sm mt-2" @click="load">Try again</button>
              </td>
            </tr>
            <tr v-else-if="!topByValue.length"><td colspan="5" class="text-center py-12 text-slate-400">No inventory recorded.</td></tr>
            <tr v-else v-for="r in topByValue" :key="r.inventoryId">
              <td class="font-mono text-xs text-slate-500">{{ r.sku }}</td>
              <td class="font-medium text-slate-800">{{ r.productName }}</td>
              <td class="text-right tabular-nums">{{ r.currentStock }}</td>
              <td class="text-right tabular-nums text-slate-600">{{ peso(r.unitPrice) }}</td>
              <td class="text-right tabular-nums font-semibold">{{ peso(r.totalValue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
