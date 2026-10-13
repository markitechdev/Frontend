<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { reportsApi } from '@/api';
import { useToastStore } from '@/stores/toast';
import StatCard from '@/components/ui/StatCard.vue';
import StatCardSkeleton from '@/components/ui/StatCardSkeleton.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import TableSkeleton from '@/components/ui/TableSkeleton.vue';
import HorizontalBarChart from '@/components/ui/HorizontalBarChart.vue';
import VerticalBarChart from '@/components/ui/VerticalBarChart.vue';
import { compactNumber } from '@/utils/chartScale';

/*
 * Uses the server-side /api/reports/* endpoints, which only require
 * reports.view. (The old page called the inventory, movements and alerts
 * endpoints directly, so roles with reports.view but not inventory.view -
 * e.g. Staff Admin - were sent to Access Denied.)
 */
const toast = useToastStore();

const inventoryRows = ref([]);
const inventorySummary = ref(null);
const shrinkRows = ref([]);
const shrinkSummary = ref(null);

const loadingInventory = ref(true);
const loadingShrink = ref(true);
const inventoryError = ref('');
const shrinkError = ref('');

const reportType = ref('stock_overview');
const chartMetric = ref('value');
const chartLayout = ref('columns'); // 'columns' (standing bars) | 'bars' (horizontal)
const filters = reactive({ categoryId: '', from: '', to: '' });

const peso = (n) => (n === null || n === undefined || n === '') ? '--' : `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pesoShort = (n) => (n === null || n === undefined || n === '') ? '--' : `₱${Math.round(Number(n)).toLocaleString('en-PH')}`;
const num  = (n) => (n === null || n === undefined || n === '') ? '--' : Number(n).toLocaleString();
const when = (d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/* ------------------------------------------------------------------ loading */
let invSeq = 0;
const loadInventory = async () => {
  const seq = ++invSeq;
  loadingInventory.value = true;
  inventoryError.value = '';
  try {
    const res = await reportsApi.inventorySummary({ categoryId: filters.categoryId });
    if (seq !== invSeq) return;
    inventoryRows.value = res.data || [];
    inventorySummary.value = res.meta?.summary || null;
  } catch (e) {
    if (seq === invSeq) inventoryError.value = e.message;
  } finally {
    if (seq === invSeq) loadingInventory.value = false;
  }
};

/** Browser-local calendar dates -> exact UTC instants, so "to" covers the whole local day. */
const toRange = () => ({
  from: filters.from ? new Date(`${filters.from}T00:00:00`).toISOString() : undefined,
  to: filters.to ? new Date(`${filters.to}T23:59:59.999`).toISOString() : undefined,
});

let shrinkSeq = 0;
const loadShrinkage = async () => {
  const seq = ++shrinkSeq;
  loadingShrink.value = true;
  shrinkError.value = '';
  try {
    const res = await reportsApi.shrinkage({ ...toRange(), categoryId: filters.categoryId });
    if (seq !== shrinkSeq) return;
    shrinkRows.value = res.data || [];
    shrinkSummary.value = res.meta?.summary || null;
  } catch (e) {
    if (seq === shrinkSeq) shrinkError.value = e.message;
  } finally {
    if (seq === shrinkSeq) loadingShrink.value = false;
  }
};

const loadAll = () => Promise.all([loadInventory(), loadShrinkage()]);

const dateError = computed(() =>
  filters.from && filters.to && filters.from > filters.to ? '"From" must be on or before "To".' : '');

watch(() => filters.categoryId, loadAll);
watch(() => [filters.from, filters.to], () => { if (!dateError.value) loadShrinkage(); });
onMounted(loadAll);

/* ------------------------------------------------------------- derived data */
// Category list comes from the unfiltered first load so the dropdown does not shrink as you filter.
const categoryOptions = ref([]);
watch(inventoryRows, (rows) => {
  if (filters.categoryId) return;
  const map = new Map();
  rows.forEach((r) => { if (r.categoryId) map.set(r.categoryId, r.category); });
  categoryOptions.value = [...map].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
});

const byCategory = computed(() => {
  const map = {};
  for (const r of inventoryRows.value) {
    const key = r.category || 'Unassigned';
    map[key] ||= { label: key, value: 0, units: 0, items: 0 };
    map[key].value += Number(r.totalValue || 0);
    map[key].units += Number(r.currentStock || 0);
    map[key].items += 1;
  }
  return Object.values(map);
});

const chartItems = computed(() => byCategory.value.map((c) => ({
  label: c.label,
  value: chartMetric.value === 'value' ? c.value : c.units,
  detail: chartMetric.value === 'value'
    ? `${num(c.units)} units across ${c.items} product(s)`
    : `${peso(c.value)} across ${c.items} product(s)`,
})));

const lowStockRows = computed(() => inventoryRows.value
  .filter((r) => ['low_stock', 'out_of_stock', 'reorder'].includes(r.stockStatus))
  .sort((a, b) => a.currentStock - b.currentStock));

const tableRows = computed(() => (reportType.value === 'low_stock' ? lowStockRows.value : inventoryRows.value));

/* ------------------------------------------------------------------- export */
const exportCsv = () => {
  let headers;
  let lines;
  let name;

  if (reportType.value === 'low_stock') {
    name = 'low-stock-report';
    headers = ['SKU', 'Product', 'Category', 'Supplier', 'Current Stock', 'Minimum', 'Reorder Point', 'Status'];
    lines = lowStockRows.value.map((r) => [r.sku, r.productName, r.category, r.supplier, r.currentStock, r.minimumStock, r.reorderPoint, r.stockStatus]);
  } else if (reportType.value === 'category') {
    name = 'category-valuation';
    headers = ['Category', 'Products', 'Units', 'Stock Value'];
    lines = byCategory.value.map((c) => [c.label, c.items, c.units, c.value.toFixed(2)]);
  } else if (reportType.value === 'shrinkage') {
    name = 'shrinkage-report';
    headers = ['Date', 'SKU', 'Product', 'Category', 'Type', 'Units', 'Unit Price', 'Loss', 'Reason', 'Recorded By'];
    lines = shrinkRows.value.map((r) => [r.dateRecorded, r.sku, r.productName, r.category, r.movementType, r.quantity, r.unitPrice.toFixed(2), r.shrinkageValue.toFixed(2), r.reason, r.recordedBy]);
  } else {
    name = 'stock-overview';
    headers = ['SKU', 'Product', 'Category', 'Supplier', 'Stock', 'Unit Price', 'Stock Value', 'Status'];
    lines = inventoryRows.value.map((r) => [r.sku, r.productName, r.category, r.supplier, r.currentStock, r.unitPrice.toFixed(2), r.totalValue.toFixed(2), r.stockStatus]);
  }

  if (!lines.length) {
    toast.info('Nothing to export for this report yet.');
    return;
  }

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers, ...lines].map((row) => row.map(esc).join(',')).join('\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Report exported.');
};
</script>

<template>
  <div class="space-y-5">
    <!-- KPI cards -->
    <div v-if="loadingInventory && !inventorySummary" class="grid gap-4 grid-cols-2 lg:grid-cols-5">
      <StatCardSkeleton v-for="i in 5" :key="i" />
    </div>
    <div v-else class="grid gap-4 grid-cols-2 lg:grid-cols-5">
      <StatCard label="Stock Value" :value="pesoShort(inventorySummary?.totalValuation)" tone="green" />
      <StatCard label="Products" :value="num(inventorySummary?.totalProducts)"
                :sublabel="`${num(inventorySummary?.totalUnits)} units on hand`" tone="blue" />
      <StatCard label="Low Stock" :value="num(inventorySummary?.lowStockCount)" tone="amber" />
      <StatCard label="Reorder Due" :value="num(inventorySummary?.reorderCount)" tone="blue" />
      <StatCard label="Out of Stock" :value="num(inventorySummary?.outOfStockCount)" tone="red" />
    </div>

    <!-- filters: one row above everything they affect -->
    <div class="card p-4 flex flex-wrap items-end gap-3">
      <div>
        <label class="text-xs text-slate-500 block mb-1" for="report-type">Report</label>
        <select id="report-type" v-model="reportType" class="select w-auto min-w-[190px]">
          <option value="stock_overview">Stock Overview</option>
          <option value="low_stock">Low Stock &amp; Reorder</option>
          <option value="category">Category Valuation</option>
          <option value="shrinkage">Shrinkage (Damaged &amp; Missing)</option>
        </select>
      </div>
      <div>
        <label class="text-xs text-slate-500 block mb-1" for="report-category">Category</label>
        <select id="report-category" v-model="filters.categoryId" class="select w-auto min-w-[170px]">
          <option value="">All categories</option>
          <option v-for="c in categoryOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div>
        <label class="text-xs text-slate-500 block mb-1" for="report-from">Shrinkage from</label>
        <input id="report-from" v-model="filters.from" type="date" class="input w-auto" :max="filters.to || undefined" />
      </div>
      <div>
        <label class="text-xs text-slate-500 block mb-1" for="report-to">to</label>
        <input id="report-to" v-model="filters.to" type="date" class="input w-auto" :min="filters.from || undefined" />
      </div>
      <button v-if="filters.categoryId || filters.from || filters.to" class="btn-ghost btn-sm"
              @click="filters.categoryId = ''; filters.from = ''; filters.to = ''">Clear</button>
      <button class="btn-primary btn-sm ml-auto" :disabled="loadingInventory || loadingShrink" @click="exportCsv">Export CSV</button>
      <p v-if="dateError" class="w-full text-xs text-red-600">{{ dateError }}</p>
    </div>

    <!-- category graph -->
    <div class="card min-w-0">
      <div class="card-header flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="card-title">{{ chartMetric === 'value' ? 'Stock Value by Category' : 'Units on Hand by Category' }}</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Total: <strong class="text-slate-800 dark:text-slate-100 tabular-nums">{{ chartMetric === 'value' ? peso(inventorySummary?.totalValuation) : `${num(inventorySummary?.totalUnits)} units` }}</strong>
          </p>
        </div>
        <div class="flex items-center gap-2">
        <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5" role="group" aria-label="Chart layout">
          <button type="button" class="p-1.5 rounded-md" title="Standing bars"
                  :class="chartLayout === 'columns' ? 'bg-navy-700 text-white' : 'text-slate-500 hover:text-slate-700'"
                  :aria-pressed="chartLayout === 'columns'" aria-label="Standing bars" @click="chartLayout = 'columns'">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="7" width="3" height="7" rx="0.5"/><rect x="6.5" y="2" width="3" height="12" rx="0.5"/><rect x="11" y="9" width="3" height="5" rx="0.5"/></svg>
          </button>
          <button type="button" class="p-1.5 rounded-md" title="Horizontal bars"
                  :class="chartLayout === 'bars' ? 'bg-navy-700 text-white' : 'text-slate-500 hover:text-slate-700'"
                  :aria-pressed="chartLayout === 'bars'" aria-label="Horizontal bars" @click="chartLayout = 'bars'">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="2" width="12" height="3" rx="0.5"/><rect x="2" y="6.5" width="7" height="3" rx="0.5"/><rect x="2" y="11" width="9" height="3" rx="0.5"/></svg>
          </button>
        </div>
        <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs" role="group" aria-label="Chart measure">
          <button type="button" class="px-2.5 py-1 rounded-md"
                  :class="chartMetric === 'value' ? 'bg-navy-700 text-white' : 'text-slate-600'"
                  :aria-pressed="chartMetric === 'value'" @click="chartMetric = 'value'">Value</button>
          <button type="button" class="px-2.5 py-1 rounded-md"
                  :class="chartMetric === 'units' ? 'bg-navy-700 text-white' : 'text-slate-600'"
                  :aria-pressed="chartMetric === 'units'" @click="chartMetric = 'units'">Units</button>
        </div>
        </div>
      </div>
      <div class="card-body">
        <VerticalBarChart
          v-if="chartLayout === 'columns'"
          :items="chartItems"
          :format-value="chartMetric === 'value' ? peso : (v) => `${num(v)} u`"
          :compact-value="chartMetric === 'value' ? (v) => `₱${compactNumber(v)}` : compactNumber"
          :measure-label="chartMetric === 'value' ? 'stock value by category' : 'units by category'"
          :loading="loadingInventory"
          :error="inventoryError"
          empty-text="No inventory in this selection."
          @retry="loadInventory"
        />
        <HorizontalBarChart
          v-else
          :items="chartItems"
          :format-value="chartMetric === 'value' ? peso : (v) => `${num(v)} u`"
          :measure-label="chartMetric === 'value' ? 'stock value by category' : 'units by category'"
          :loading="loadingInventory"
          :error="inventoryError"
          empty-text="No inventory in this selection."
          @retry="loadInventory"
        />
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <!-- shrinkage summary -->
      <div class="card lg:col-span-1 min-w-0">
        <div class="card-header">
          <h2 class="card-title">Shrinkage Summary</h2>
          <span class="text-[11px] text-slate-400">{{ filters.from || filters.to ? 'Selected dates' : 'All time' }}</span>
        </div>
        <div class="card-body space-y-3 text-sm">
          <template v-if="loadingShrink">
            <div v-for="i in 3" :key="i" class="h-4 rounded bg-slate-200 animate-pulse" />
          </template>
          <div v-else-if="shrinkError" class="text-center">
            <p class="text-sm text-red-600">{{ shrinkError }}</p>
            <button class="btn-ghost btn-sm mt-2" @click="loadShrinkage">Try again</button>
          </div>
          <template v-else>
            <div class="flex justify-between"><span class="text-slate-500">Damaged</span>
              <span class="font-semibold tabular-nums">{{ num(shrinkSummary?.breakdown?.damaged?.units) }} units</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Missing</span>
              <span class="font-semibold tabular-nums">{{ num(shrinkSummary?.breakdown?.missing?.units) }} units</span></div>
            <div class="flex justify-between pt-2 border-t border-slate-100">
              <span class="text-slate-700 font-medium">Estimated loss</span>
              <span class="font-bold text-red-600 tabular-nums">{{ peso(shrinkSummary?.totalShrinkageValue) }}</span>
            </div>
            <p class="text-[11px] text-slate-400 pt-1">
              From recorded damaged and missing movements (including cycle-count variances) at current unit price.
            </p>
          </template>
        </div>
      </div>

      <!-- report table -->
      <div class="card lg:col-span-2 min-w-0">
        <div class="card-header">
          <h2 class="card-title">
            {{ { low_stock: 'Items Below Threshold', shrinkage: 'Shrinkage Events', category: 'Category Valuation' }[reportType] || 'Stock Overview' }}
          </h2>
          <span class="text-xs text-slate-400">
            {{ (reportType === 'shrinkage' ? shrinkRows : reportType === 'category' ? byCategory : tableRows).length }} row(s)
          </span>
        </div>
        <div class="overflow-x-auto max-h-96 overflow-y-auto">
          <!-- shrinkage table -->
          <table v-if="reportType === 'shrinkage'" class="table">
            <thead class="sticky top-0">
              <tr><th>Date</th><th>Product</th><th>Type</th><th class="text-right">Units</th><th class="text-right">Loss</th><th>Reason</th></tr>
            </thead>
            <TableSkeleton v-if="loadingShrink" :columns="6" :rows="4" />
            <tbody v-else>
              <tr v-if="!shrinkRows.length"><td colspan="6" class="text-center py-10 text-slate-400">No damaged or missing stock recorded for these filters.</td></tr>
              <tr v-for="r in shrinkRows" :key="r.movementId">
                <td class="text-xs text-slate-500 whitespace-nowrap">{{ when(r.dateRecorded) }}</td>
                <td><p class="font-medium text-slate-800">{{ r.productName }}</p><p class="font-mono text-[11px] text-slate-400">{{ r.sku }}</p></td>
                <td><span :class="r.movementType === 'missing' ? 'badge-red' : 'badge-amber'">{{ r.movementType }}</span></td>
                <td class="text-right tabular-nums">{{ r.quantity }}</td>
                <td class="text-right tabular-nums font-semibold">{{ peso(r.shrinkageValue) }}</td>
                <td class="text-xs text-slate-500 max-w-[14rem] truncate" :title="r.reason">{{ r.reason }}</td>
              </tr>
            </tbody>
          </table>

          <!-- category table -->
          <table v-else-if="reportType === 'category'" class="table">
            <thead class="sticky top-0">
              <tr><th>Category</th><th class="text-right">Products</th><th class="text-right">Units</th><th class="text-right">Value</th></tr>
            </thead>
            <TableSkeleton v-if="loadingInventory" :columns="4" :rows="4" />
            <tbody v-else>
              <tr v-if="!byCategory.length"><td colspan="4" class="text-center py-10 text-slate-400">Nothing to show.</td></tr>
              <tr v-for="c in [...byCategory].sort((a, b) => b.value - a.value)" :key="c.label">
                <td class="font-medium text-slate-800">{{ c.label }}</td>
                <td class="text-right tabular-nums">{{ c.items }}</td>
                <td class="text-right tabular-nums">{{ num(c.units) }}</td>
                <td class="text-right tabular-nums font-semibold">{{ peso(c.value) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- stock overview / low stock -->
          <table v-else class="table">
            <thead class="sticky top-0">
              <tr><th>SKU</th><th>Product</th><th class="text-right">Stock</th><th class="text-right">Value</th><th>Status</th></tr>
            </thead>
            <TableSkeleton v-if="loadingInventory" :columns="5" :rows="5" />
            <tbody v-else>
              <tr v-if="inventoryError"><td colspan="5" class="text-center py-10 text-red-600">{{ inventoryError }}</td></tr>
              <tr v-else-if="!tableRows.length">
                <td colspan="5" class="text-center py-10 text-slate-400">
                  {{ reportType === 'low_stock' ? 'Every product is above its reorder point.' : 'No products in this selection.' }}
                </td>
              </tr>
              <tr v-for="r in tableRows" :key="r.inventoryId">
                <td class="font-mono text-xs text-slate-500">{{ r.sku }}</td>
                <td class="font-medium text-slate-800">{{ r.productName }}</td>
                <td class="text-right font-semibold tabular-nums">{{ r.currentStock }}</td>
                <td class="text-right tabular-nums text-slate-600">{{ peso(r.totalValue) }}</td>
                <td><StatusBadge :status="r.stockStatus" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
