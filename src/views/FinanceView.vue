<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { reportsApi, salesApi } from '@/api';
import StatCard from '@/components/ui/StatCard.vue';
import VerticalBarChart from '@/components/ui/VerticalBarChart.vue';
import HorizontalBarChart from '@/components/ui/HorizontalBarChart.vue';

/**
 * Financial reports for the Finance Admin:
 *  - sales performance for a chosen period (/api/sales/summary)
 *  - inventory valuation and shrinkage cost (/api/reports/*)
 */
const peso = (n) => (n === null || n === undefined || n === '') ? '--' : `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pesoShort = (n) => (n === null || n === undefined || n === '') ? '--' : `₱${Math.round(Number(n)).toLocaleString('en-PH')}`;
const num = (n) => (n === null || n === undefined || n === '') ? '--' : Number(n).toLocaleString();
const PAYMENT_LABELS = { cash: 'Cash', gcash: 'GCash', card: 'Card', bank_transfer: 'Bank transfer' };

// ------------------------------------------------------------ period
const iso = (d) => d.toISOString().slice(0, 10);
const presets = [
  { key: 'today', label: 'Today', range: () => { const t = iso(new Date()); return [t, t]; } },
  { key: '7d', label: 'Last 7 days', range: () => { const t = new Date(); const f = new Date(t.getTime() - 6 * 864e5); return [iso(f), iso(t)]; } },
  { key: 'month', label: 'This month', range: () => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth(), 1)), iso(t)]; } },
  { key: '30d', label: 'Last 30 days', range: () => { const t = new Date(); const f = new Date(t.getTime() - 29 * 864e5); return [iso(f), iso(t)]; } },
  { key: 'all', label: 'All time', range: () => ['', ''] },
];
const period = reactive({ key: 'month', from: '', to: '' });
[period.from, period.to] = presets[2].range();
const periodLabel = computed(() => {
  if (!period.from && !period.to) return 'all time';
  const f = (d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  return period.from === period.to ? f(period.from) : `${f(period.from)} – ${f(period.to)}`;
});
const choosePreset = (p) => { period.key = p.key; [period.from, period.to] = p.range(); loadSales(); };
const customRange = () => {
  if (period.from && period.to && period.from > period.to) return;
  period.key = 'custom'; loadSales();
};

// ------------------------------------------------------------ sales report
const sales = ref(null);
const salesLoading = ref(true);
const salesError = ref('');
let seq = 0;
const loadSales = async () => {
  const my = ++seq;
  salesLoading.value = true; salesError.value = '';
  try {
    const data = await salesApi.summary({ from: period.from || undefined, to: period.to || undefined });
    if (my === seq) sales.value = data;
  } catch (e) { if (my === seq) salesError.value = e.message; }
  finally { if (my === seq) salesLoading.value = false; }
};

const revenueByDay = computed(() => (sales.value?.byDay || []).map((d) => ({
  label: new Date(d.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
  value: d.revenue,
  detail: `${d.transactions} sale${d.transactions === 1 ? '' : 's'} · ${d.items} item${d.items === 1 ? '' : 's'}`,
})));
const topProducts = computed(() => (sales.value?.topProducts || []).map((p) => ({
  label: p.productName || p.sku, value: p.revenue, detail: `${p.units} unit${p.units === 1 ? '' : 's'}`,
})));
const paymentMix = computed(() => {
  const rows = sales.value?.byPaymentMethod || [];
  const total = rows.reduce((s, r) => s + r.revenue, 0) || 1;
  return rows.map((r) => ({ ...r, label: PAYMENT_LABELS[r.paymentMethod] || r.paymentMethod, share: r.revenue / total }));
});
const s = computed(() => sales.value?.summary || null);

// ------------------------------------------------------------ inventory valuation
const summary = ref(null);
const rows = ref([]);
const shrink = ref(null);
const invLoading = ref(true);
const invError = ref('');
const topByValue = computed(() => [...rows.value].sort((a, b) => b.totalValue - a.totalValue).slice(0, 10));
const capitalAtRisk = computed(() => rows.value
  .filter((r) => r.stockStatus === 'low_stock' || r.stockStatus === 'out_of_stock')
  .reduce((acc, r) => acc + r.totalValue, 0));

const loadInventory = async () => {
  invLoading.value = true; invError.value = '';
  try {
    const [inv, shr] = await Promise.all([reportsApi.inventorySummary({}), reportsApi.shrinkage({})]);
    rows.value = inv.data || [];
    summary.value = inv.meta?.summary || null;
    shrink.value = shr.meta?.summary || null;
  } catch (e) { invError.value = e.message; }
  finally { invLoading.value = false; }
};

onMounted(() => { loadSales(); loadInventory(); });
</script>

<template>
  <div class="space-y-6">
    <!-- header + period -->
    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
      <div>
        <p class="text-xs font-bold tracking-widest text-sky-700 uppercase">Finance</p>
        <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mt-1">Financial Reports</h1>
        <p class="text-sm text-slate-600 mt-1">Sales performance for <b class="text-slate-800">{{ periodLabel }}</b>, plus the value tied up in stock.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Report period">
          <button v-for="p in presets" :key="p.key" type="button"
                  class="px-2.5 py-1.5 text-xs font-semibold rounded-md transition"
                  :class="period.key === p.key ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'"
                  @click="choosePreset(p)">{{ p.label }}</button>
        </div>
        <span class="inline-flex items-center gap-2">
          <input v-model="period.from" type="date" class="input !py-1.5 !w-auto text-xs" aria-label="From date" @change="customRange" />
          <span class="text-xs text-slate-600">to</span>
          <input v-model="period.to" type="date" class="input !py-1.5 !w-auto text-xs" aria-label="To date" @change="customRange" />
        </span>
      </div>
    </div>

    <!-- sales KPIs -->
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard :index="0" icon="💵" label="Revenue" :value="salesLoading ? '--' : pesoShort(s?.revenue)" :sublabel="s ? `${num(s.transactions)} completed sale(s)` : ''" tone="green" />
      <StatCard :index="1" icon="📦" label="Items sold" :value="salesLoading ? '--' : num(s?.itemsSold)" :sublabel="s ? `Average sale ${peso(s.averageSale)}` : ''" tone="blue" />
      <StatCard :index="2" icon="🏷️" label="Discounts given" :value="salesLoading ? '--' : pesoShort(s?.discounts)" :sublabel="s ? `Gross sales ${pesoShort(s.grossSales)}` : ''" tone="amber" />
      <StatCard :index="3" icon="↩️" label="Voided sales" :value="salesLoading ? '--' : num(s?.voidedCount)" :sublabel="s && s.voidedCount ? `${peso(s.voidedValue)} returned to stock` : 'Nothing voided'" tone="red" />
    </div>

    <!-- charts -->
    <div class="grid gap-4 lg:grid-cols-5">
      <div class="card lg:col-span-3 anim-rise" style="--d: 4">
        <div class="card-header"><h2 class="card-title">Revenue by day</h2><span class="text-xs text-slate-500">{{ periodLabel }}</span></div>
        <div class="p-4">
          <VerticalBarChart :items="revenueByDay" :format-value="peso" measure-label="revenue" :loading="salesLoading" :error="salesError" :max-bars="31" empty-text="No sales in this period." />
        </div>
      </div>
      <div class="card lg:col-span-2 anim-rise" style="--d: 5">
        <div class="card-header"><h2 class="card-title">Payment methods</h2></div>
        <div class="p-4 space-y-3">
          <p v-if="salesLoading" class="text-xs text-slate-500">Loading…</p>
          <p v-else-if="!paymentMix.length" class="text-xs text-slate-500">No sales in this period.</p>
          <div v-for="(m, i) in paymentMix" :key="m.paymentMethod" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-slate-800">{{ m.label }}</span>
              <span class="tabular-nums text-slate-600">{{ peso(m.revenue) }} <span class="text-xs text-slate-500">· {{ Math.round(m.share * 100) }}%</span></span>
            </div>
            <div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r from-navy-700 to-sky-500 grow-x" :style="{ width: `${Math.max(2, m.share * 100)}%`, '--d': i }" /></div>
            <p class="text-xs text-slate-500">{{ m.transactions }} transaction{{ m.transactions === 1 ? '' : 's' }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="card anim-rise" style="--d: 6">
        <div class="card-header"><h2 class="card-title">Top products by revenue</h2><RouterLink to="/sales" class="text-xs font-medium text-navy-600 hover:underline">All transactions</RouterLink></div>
        <div class="p-4">
          <HorizontalBarChart :items="topProducts" :format-value="peso" measure-label="revenue" :loading="salesLoading" :error="salesError" :max-bars="10" empty-text="No sales in this period." />
        </div>
      </div>

      <!-- inventory valuation -->
      <div class="card anim-rise" style="--d: 7">
        <div class="card-header"><h2 class="card-title">Capital in stock</h2><RouterLink to="/reports" class="text-xs font-medium text-navy-600 hover:underline">Full report</RouterLink></div>
        <div class="p-4 grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-emerald-50 border border-emerald-100 p-3"><p class="text-xs font-semibold text-emerald-800 uppercase">Inventory valuation</p><p class="text-xl font-bold text-slate-900 tabular-nums mt-1">{{ invLoading ? '--' : pesoShort(summary?.totalValuation) }}</p><p class="text-xs text-slate-600">{{ invLoading ? '' : `${num(summary?.totalUnits)} units at current prices` }}</p></div>
          <div class="rounded-lg bg-amber-50 border border-amber-100 p-3"><p class="text-xs font-semibold text-amber-800 uppercase">Low / out of stock</p><p class="text-xl font-bold text-slate-900 tabular-nums mt-1">{{ invLoading ? '--' : pesoShort(capitalAtRisk) }}</p><p class="text-xs text-slate-600">{{ invLoading ? '' : `${num((summary?.lowStockCount || 0) + (summary?.outOfStockCount || 0))} item(s) at risk` }}</p></div>
          <div class="rounded-lg bg-rose-50 border border-rose-100 p-3 col-span-2"><p class="text-xs font-semibold text-rose-800 uppercase">Shrinkage loss</p><p class="text-xl font-bold text-slate-900 tabular-nums mt-1">{{ invLoading ? '--' : pesoShort(shrink?.totalShrinkageValue) }}</p><p class="text-xs text-slate-600">{{ shrink ? `${num(shrink.totalShrinkageUnits)} units damaged or missing` : '' }}</p></div>
        </div>
        <div class="overflow-x-auto border-t border-slate-100">
          <table class="table">
            <thead><tr><th>Product</th><th class="text-right">Units</th><th class="text-right">Value</th></tr></thead>
            <tbody>
              <tr v-if="invLoading"><td colspan="3" class="text-center py-8 text-slate-500">Loading…</td></tr>
              <tr v-else-if="invError"><td colspan="3" class="text-center py-6"><p class="text-sm text-red-600">{{ invError }}</p><button class="btn-ghost btn-sm mt-2" @click="loadInventory">Try again</button></td></tr>
              <tr v-else-if="!topByValue.length"><td colspan="3" class="text-center py-8 text-slate-500">No inventory recorded.</td></tr>
              <tr v-else v-for="r in topByValue.slice(0, 6)" :key="r.inventoryId">
                <td><span class="font-medium text-slate-800">{{ r.productName }}</span> <span class="font-mono text-xs text-slate-500">{{ r.sku }}</span></td>
                <td class="text-right tabular-nums">{{ r.currentStock }}</td>
                <td class="text-right tabular-nums font-semibold">{{ peso(r.totalValue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
