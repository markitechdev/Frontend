<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { useDashboardStore } from '@/stores/dashboard';
import Skeleton from '@/components/ui/Skeleton.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import StatCardSkeleton from '@/components/ui/StatCardSkeleton.vue';
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue';
import { actionLabel } from '@/utils/auditLabels';

const auth = useAuthStore();
const toast = useToastStore();
const router = useRouter();
const dashboardStore = useDashboardStore();

const data = computed(() => dashboardStore.data);
const loading = computed(() => dashboardStore.loading && !dashboardStore.data);
const error = computed(() => dashboardStore.error);

const peso = (n) => (n === null || n === undefined || n === '') ? '--' : `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num  = (n) => (n === null || n === undefined || n === '') ? '--' : Number(n).toLocaleString();
const when = (d) => new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const cards   = computed(() => data.value?.cards ?? {});
// Each role only receives the cards its permissions allow; show the matching layout.
const hasInventory = computed(() => cards.value.totalProducts !== undefined);
// Known before the data arrives, so the greeting banner doesn't change size on load.
const bannerInventory = computed(() => hasInventory.value || auth.can('inventory.view'));

/** Signed quantity: outflows negative, adjustments keep their own sign. */
const signedQty = (m) => {
  if (m.movement_type === 'adjustment') return m.quantity < 0 ? `-${Math.abs(m.quantity)}` : `+${m.quantity}`;
  return ['stock_out', 'damaged', 'missing'].includes(m.movement_type) ? `-${Math.abs(m.quantity)}` : `+${Math.abs(m.quantity)}`;
};
const panels  = computed(() => data.value?.panels ?? {});

const greetingTime = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
});

const getRoleDisplay = (code, name) => {
  const c = (code || '').toLowerCase();
  let icon = '👤';
  if (c === 'super_admin') icon = '🛡️';
  else if (c === 'staff_admin' || c === 'admin') icon = '⚙️';
  else if (c.includes('manager')) icon = '🧭';
  else if (c.includes('warehouse')) icon = '📦';
  else if (c.includes('purchas')) icon = '🛒';
  else if (c.includes('analyst')) icon = '📊';
  else if (c.includes('audit')) icon = '🔍';
  else if (c.includes('finance')) icon = '💰';
  else if (c === 'staff' || c === 'user') icon = '👤';
  else if (c) icon = '🧩';
  return { icon, text: name || (code ? code.toUpperCase() : 'Staff') };
};

const roleInfo = computed(() => getRoleDisplay(auth.roleCode, auth.roleName));

const priorityTotal = computed(() => {
  const p = panels.value.alertsByPriority || {};
  return (p.critical || 0) + (p.high || 0) + (p.medium || 0) + (p.low || 0);
});

const priorityPct = (count) => {
  if (!priorityTotal.value || !count) return 0;
  return Math.round((count / priorityTotal.value) * 100);
};

const priorityBarWidth = (count) => {
  if (!priorityTotal.value || !count) return '0%';
  const rawPct = (count / priorityTotal.value) * 100;
  return `${Math.max(4, rawPct)}%`;
};

const load = async (force = false) => {
  try {
    await dashboardStore.fetchDashboard(force);
  } catch (e) {
    toast.error(dashboardStore.error || e.message);
  }
};

onMounted(() => load(false));
</script>

<template>
  <div class="space-y-6">
    <!-- Operational Command Greeting Banner -->
    <div class="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-sky-50 p-5 sm:p-6 shadow-sm">
      <div aria-hidden="true" class="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl float-wide" />
      <div aria-hidden="true" class="pointer-events-none absolute right-1/3 -bottom-32 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl float-wide-r" />
      <div class="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold tracking-widest text-sky-700 uppercase">
            {{ bannerInventory ? 'Warehouse Operations' : 'Workspace Overview' }}
          </span>
          <span v-if="bannerInventory" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Inventory
          </span>
        </div>
        <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
          {{ greetingTime }}, <span class="text-slate-900">{{ auth.user?.fullName }}</span>.
        </h1>
        <p class="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
          You are signed in as
          <span class="font-bold text-slate-700">{{ roleInfo.icon }} {{ roleInfo.text }}</span> in <span class="font-bold text-slate-700">{{ auth.tenantName }}</span>.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          class="btn-ghost btn-sm"
          :disabled="dashboardStore.loading"
          @click="load(true)"
          title="Refresh the dashboard figures"
        >
          <svg :class="['w-3.5 h-3.5', dashboardStore.loading ? 'animate-spin text-sky-600' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <!-- both labels share one cell, so the button keeps its width (no layout shift) -->
          <span class="grid justify-items-center">
            <span class="col-start-1 row-start-1" :class="{ invisible: dashboardStore.loading }">Refresh</span>
            <span class="col-start-1 row-start-1" :class="{ invisible: !dashboardStore.loading }">Refreshing…</span>
          </span>
        </button>

        <RouterLink
          v-if="auth.can('products.create')"
          to="/inventory"
          class="btn-primary btn-sm"
        >
          <span>+ Add Product</span>
        </RouterLink>

        <RouterLink
          v-if="auth.can('movements.view')"
          to="/movements"
          class="btn-accent btn-sm"
        >
          <span>⇄ Movement Ledger</span>
        </RouterLink>
      </div>
      </div>
    </div>

    <!-- Loading Skeleton State -->
    <div v-if="loading" class="space-y-6">
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton v-for="i in 4" :key="`sc-skel-${i}`" />
      </div>
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="card p-5 lg:col-span-2 space-y-4">
          <Skeleton width="180px" height="1.25rem" />
          <div class="space-y-3 pt-2">
            <div v-for="j in 4" :key="`row-skel-${j}`" class="flex justify-between items-center py-2">
              <Skeleton width="35%" height="1rem" />
              <Skeleton width="20%" height="1rem" />
              <Skeleton width="15%" height="1rem" />
            </div>
          </div>
        </div>
        <div class="card p-5 space-y-4">
          <Skeleton width="140px" height="1.25rem" />
          <div class="space-y-3 pt-2">
            <div v-for="k in 4" :key="`bar-skel-${k}`" class="space-y-1.5 py-1">
              <Skeleton width="100%" height="0.5rem" rounded="rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State with Retry -->
    <div v-else-if="error" class="card p-8 border-rose-200 bg-rose-50/40 text-center space-y-3">
      <div class="h-12 w-12 rounded-full bg-rose-100 text-rose-600 mx-auto grid place-items-center text-xl font-bold">
        ⚠
      </div>
      <h3 class="text-base font-bold text-slate-800">Failed to load dashboard metrics</h3>
      <p class="text-xs text-slate-600 max-w-md mx-auto">{{ error }}</p>
      <div class="pt-2">
        <button class="btn-primary btn-sm" @click="load">Retry Query</button>
      </div>
    </div>

    <!-- Loaded Real Operational Dashboard -->
    <template v-else>
      <!-- Varied Operational KPI Cards Hierarchy -->
      <!-- Account-focused roles (e.g. Staff Admin) do not receive inventory figures -->
      <div v-if="!hasInventory" class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div v-if="cards.totalUsers !== undefined" class="card lift anim-rise p-4 border-l-4 border-l-sky-500" style="--d: 0">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Accounts</span>
          <p class="text-2xl font-black text-slate-900 tracking-tight mt-2"><AnimatedNumber :value="cards.totalUsers" /></p>
          <p class="text-[11px] text-slate-500 font-medium mt-0.5">Users who can currently sign in</p>
        </div>
        <div v-if="cards.activeSuppliers !== undefined" class="card lift anim-rise p-4 border-l-4 border-l-slate-700" style="--d: 1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Suppliers</span>
          <p class="text-2xl font-black text-slate-900 tracking-tight mt-2"><AnimatedNumber :value="cards.activeSuppliers" /></p>
        </div>
        <div v-if="cards.totalUsers === undefined && cards.activeSuppliers === undefined" class="card p-5 sm:col-span-2 lg:col-span-4 text-sm text-slate-500">
          Your role has no dashboard figures yet. Use the sidebar to open the modules you have access to.
        </div>
      </div>
      <div v-else class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <!-- 1. Catalog Products Volume (Primary Card) -->
        <div class="group card lift anim-rise p-4 border-l-4 border-l-sky-500 flex flex-col justify-between" style="--d: 0">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Catalog</span>
            <span class="h-8 w-8 rounded-lg bg-sky-50 text-sky-700 border-sky-100 flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" /></svg>
            </span>
          </div>
          <div class="mt-2">
            <p class="text-2xl font-black text-slate-900 tracking-tight">
              <AnimatedNumber :value="cards.totalProducts" />
            </p>
            <p class="text-[11px] text-slate-500 font-medium mt-0.5">
              {{ cards.totalQuantity !== undefined ? `${num(cards.totalQuantity)} units physical stock` : 'Physical stock units' }}
            </p>
          </div>
        </div>

        <!-- 2. Inventory Valuation (Capital Card) -->
        <div class="group card lift anim-rise p-4 border-l-4 border-l-emerald-500 flex flex-col justify-between" style="--d: 1">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Stock Capital Valuation</span>
            <span class="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Z" /><path d="M3 7V6a2 2 0 0 1 2-2h11" /><circle cx="16.5" cy="13.5" r="1.5" /></svg>
            </span>
          </div>
          <div class="mt-2">
            <p class="text-2xl font-black text-slate-900 tracking-tight">
              <AnimatedNumber :value="cards.totalValue" :format="peso" />
            </p>
            <p class="text-[11px] text-slate-500 font-medium mt-0.5">
              Aggregate unit inventory asset valuation
            </p>
          </div>
        </div>

        <!-- 3. Stock Depletion Status Strip (Warning/Action Card) -->
        <div class="group card lift anim-rise p-4 border-l-4 border-l-amber-500 flex flex-col justify-between" style="--d: 2">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Stock Warning Strip</span>
            <span class="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 border-amber-100 flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4" /><path d="M12 17h.01" /></svg>
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-slate-100">
            <div>
              <span class="text-[10px] uppercase font-bold text-amber-700 block">Low Stock</span>
              <p class="text-lg font-bold text-slate-900"><AnimatedNumber :value="cards.lowStock" /></p>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-rose-700 block">Out of Stock</span>
              <p class="text-lg font-bold text-slate-900"><AnimatedNumber :value="cards.outOfStock" /></p>
            </div>
          </div>
        </div>

        <!-- 4. Shrinkage / Operational Network (Loss & Logistics Card) -->
        <div class="group card lift anim-rise p-4 border-l-4 border-l-slate-700 flex flex-col justify-between" style="--d: 3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Operations Network</span>
            <span class="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 border-slate-200 flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3z" /><path d="M14 9h4l3 3v4h-7z" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></svg>
            </span>
          </div>
          <div class="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Suppliers</span>
              <p class="text-base font-bold text-slate-900"><AnimatedNumber :value="cards.activeSuppliers" /></p>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Reorder Due</span>
              <p class="text-base font-bold text-sky-700"><AnimatedNumber :value="cards.reorderDue" /></p>
            </div>
            <div v-if="cards.shrinkageUnits30d !== undefined" class="text-right">
              <span class="text-[10px] uppercase font-bold text-rose-700 block">Shrinkage</span>
              <p class="text-base font-bold text-slate-900"><AnimatedNumber :value="cards.shrinkageUnits30d" /></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Finance Planned Notice -->
      <div
        v-if="panels.financeNotice"
        class="card p-4 border-l-4 border-l-amber-400 bg-amber-50/50 flex items-start gap-3"
      >
        <span class="text-lg">📢</span>
        <div>
          <p class="text-xs font-bold text-amber-900 uppercase tracking-wide">Finance Module — Architecture Roadmap</p>
          <p class="text-xs text-amber-800 mt-0.5 leading-relaxed">{{ panels.financeNotice.message }}</p>
        </div>
      </div>

      <!-- Main Operational Split Grids -->
      <div class="grid gap-5 lg:grid-cols-3">
        <!-- Stock Depletion / Items Needing Action Table -->
        <div v-if="panels.lowStockItems" class="card anim-rise lg:col-span-2" style="--d: 4">
          <div class="card-header">
            <div class="flex items-center gap-2">
              <span class="text-base">🚨</span>
              <h2 class="card-title">Items Needing Immediate Action</h2>
            </div>
            <RouterLink to="/inventory" class="text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline">
              Open Inventory Catalog →
            </RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th class="text-right">Current Stock</th>
                  <th class="text-right">Reorder Point</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!panels.lowStockItems.length">
                  <td colspan="5" class="text-center py-10 text-slate-500 font-medium">
                    All inventory catalog items are currently above safety thresholds.
                  </td>
                </tr>
                <tr v-for="(it, i) in panels.lowStockItems" :key="it.productId" class="anim-fade-wide hover:bg-slate-50/80 transition-colors" :style="{ '--d': 5 + Math.min(i, 8) }">
                  <td class="font-mono text-xs font-bold text-slate-600">{{ it.sku }}</td>
                  <td class="font-semibold text-slate-900">
                    <RouterLink :to="`/inventory/${it.productId}`" class="hover:text-sky-600 hover:underline">
                      {{ it.productName }}
                    </RouterLink>
                  </td>
                  <td class="text-right font-black tabular-nums text-slate-900">{{ it.currentStock }}</td>
                  <td class="text-right tabular-nums text-slate-500 font-medium">{{ it.reorderPoint }}</td>
                  <td><StatusBadge :status="it.status" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Alerts by Priority -->
        <div v-if="panels.alertsByPriority" class="card anim-rise" style="--d: 5">
          <div class="card-header">
            <div class="flex items-center gap-2">
              <span class="text-base">⚡</span>
              <h2 class="card-title">Alerts by Priority</h2>
            </div>
            <RouterLink to="/alerts" class="text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline">
              View All →
            </RouterLink>
          </div>
          <div class="card-body space-y-4">
            <div
              v-for="(count, level, i) in panels.alertsByPriority"
              :key="level"
              class="group relative"
              :style="{ '--d': 6 + i }"
            >
              <div class="flex items-center justify-between text-xs mb-1.5 font-bold">
                <StatusBadge :status="level" />
                <div class="flex items-center gap-1.5 tabular-nums">
                  <span class="text-[11px] text-slate-500">({{ priorityPct(count) }}%)</span>
                  <span class="text-slate-800">{{ count }}</span>
                </div>
              </div>
              <div class="h-2 rounded-full bg-slate-100 overflow-hidden relative">
                <div
                  class="h-full rounded-full grow-x"
                  :class="{
                    'bg-rose-500': level === 'critical',
                    'bg-amber-500': level === 'high',
                    'bg-sky-500': level === 'medium',
                    'bg-slate-400': level === 'low'
                  }"
                  :style="{ width: priorityBarWidth(count) }"
                />
              </div>
            </div>
            <p v-if="!priorityTotal" class="text-xs text-slate-500 text-center py-4 font-medium">
              No active operational alerts requiring intervention.
            </p>
          </div>
        </div>

        <!-- Recent Stock Movements Stream -->
        <div v-if="panels.recentMovements" class="card anim-rise lg:col-span-2" style="--d: 6">
          <div class="card-header">
            <div class="flex items-center gap-2">
              <span class="text-base">🔄</span>
              <h2 class="card-title">Recent Stock Movement Stream</h2>
            </div>
            <RouterLink to="/movements" class="text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline">
              Ledger Transactions →
            </RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Movement Type</th>
                  <th class="text-right">Quantity</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!panels.recentMovements.length">
                  <td colspan="5" class="text-center py-10 text-slate-500 font-medium">
                    No movement ledger entries recorded yet.
                  </td>
                </tr>
                <tr v-for="(m, i) in panels.recentMovements" :key="m.movement_id" class="anim-fade-wide hover:bg-slate-50/80 transition-colors" :style="{ '--d': 7 + Math.min(i, 8) }">
                  <td class="text-xs font-mono text-slate-500 whitespace-nowrap">{{ when(m.date_recorded) }}</td>
                  <td>
                    <p class="font-bold text-slate-900 leading-tight">{{ m.product?.product_name }}</p>
                    <p class="text-[11px] text-slate-500 font-mono">{{ m.product?.sku }}</p>
                  </td>
                  <td><StatusBadge :status="m.movement_type" /></td>
                  <td class="text-right font-black tabular-nums text-slate-900">
                    {{ signedQty(m) }}
                  </td>
                  <td class="text-xs text-slate-600 font-medium">{{ m.recorded_by_user?.full_name || 'System' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Users by Role Distribution -->
        <div v-if="panels.usersByRole" class="card anim-rise" style="--d: 7">
          <div class="card-header">
            <div class="flex items-center gap-2">
              <span class="text-base">👥</span>
              <h2 class="card-title">Workspace Roles</h2>
            </div>
          </div>
          <div class="card-body space-y-2.5">
            <div
              v-for="r in panels.usersByRole"
              :key="r.roleCode"
              class="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 transition-colors hover:bg-white hover:border-slate-200"
            >
              <div class="flex items-center gap-1.5 font-bold text-slate-800">
                <span>{{ getRoleDisplay(r.roleCode, r.roleName).icon }}</span>
                <span>{{ r.roleName }}</span>
              </div>
              <span class="badge-gray tabular-nums">{{ r.count }} user(s)</span>
            </div>
          </div>
        </div>

        <!-- Recent System Activity Audit -->
        <div v-if="panels.recentActivity" class="card anim-rise lg:col-span-3" style="--d: 8">
          <div class="card-header">
            <div class="flex items-center gap-2">
              <span class="text-base">📜</span>
              <h2 class="card-title">Recent Operational Activity</h2>
            </div>
            <RouterLink to="/activity" class="text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline">
              View Audit Trail →
            </RouterLink>
          </div>
          <div class="card-body space-y-2">
            <div v-if="!panels.recentActivity.length" class="text-xs text-slate-500 text-center py-6 font-medium">
              No recent audit trail entries logged.
            </div>
            <div
              v-for="(log, i) in panels.recentActivity"
              :key="log.log_id"
              class="anim-fade-wide flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs transition-colors hover:bg-white hover:border-slate-200"
              :style="{ '--d': 9 + Math.min(i, 8) }"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="badge-cyan shrink-0" :title="log.action">{{ actionLabel(log.action) }}</span>
                <span class="font-bold text-slate-900 truncate">{{ log.user?.full_name || 'System Operator' }}</span>
                <span class="text-slate-500 font-mono text-[11px] truncate">#{{ log.entity_type }}</span>
              </div>
              <span class="text-[11px] font-mono text-slate-500 whitespace-nowrap">{{ when(log.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
