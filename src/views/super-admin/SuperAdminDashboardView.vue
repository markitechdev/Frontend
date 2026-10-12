<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSuperAdminDashboardStore } from '@/stores/superAdminDashboard';
import StatCard from '@/components/ui/StatCard.vue';
import StatCardSkeleton from '@/components/ui/StatCardSkeleton.vue';
import TableSkeleton from '@/components/ui/TableSkeleton.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import Skeleton from '@/components/ui/Skeleton.vue';

const auth = useAuthStore();
const dashStore = useSuperAdminDashboardStore();

const loading = computed(() => dashStore.loading && !dashStore.data);
const error = computed(() => dashStore.error);
const data = computed(() => dashStore.data);
const stats = computed(() => dashStore.stats);

const adminName = computed(() => {
  return auth.user?.fullName || auth.user?.name || 'Administrator';
});

const peso = (n) => (n === null || n === undefined || n === '') ? '--' : `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n) => (n === null || n === undefined || n === '') ? '--' : Number(n).toLocaleString();
const when = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Seamlessly normalize cards across backend payload structures
const cards = computed(() => {
  const d = data.value;
  if (!d) return null;
  const c = d.cards || {};
  const inv = d.inventoryHealth || {};
  const plat = d.platformOverview || {};
  return {
    totalProducts: c.totalProducts ?? inv.totalProducts,
    totalValue: c.totalValue ?? inv.totalValuation,
    totalQuantity: c.totalQuantity ?? inv.totalStockUnits,
    lowStock: c.lowStock ?? inv.lowStockCount,
    outOfStock: c.outOfStock ?? inv.outOfStockCount,
    reorderDue: c.reorderDue ?? inv.reorderDueCount,
    activeSuppliers: c.activeSuppliers ?? inv.activeSuppliers,
    totalUsers: c.totalUsers ?? plat.totalUsers ?? stats.value?.totalUsers,
    shrinkageUnits30d: c.shrinkageUnits30d ?? inv.shrinkageUnits30d,
    shrinkageValue30d: c.shrinkageValue30d ?? inv.shrinkageValue30d,
  };
});

// Telemetry banner normalized values
const platformStatusDisplay = computed(() => {
  if (loading.value && !data.value) return '--';
  return stats.value?.platformStatus || data.value?.platformOverview?.platformStatus || 'Healthy';
});

const totalUsersCount = computed(() => {
  if (stats.value?.totalUsers !== undefined && stats.value?.totalUsers !== null) return stats.value.totalUsers;
  if (data.value?.platformOverview?.totalUsers !== undefined && data.value?.platformOverview?.totalUsers !== null) return data.value.platformOverview.totalUsers;
  if (data.value?.cards?.totalUsers !== undefined && data.value?.cards?.totalUsers !== null) return data.value.cards.totalUsers;
  return null;
});

const totalRolesCount = computed(() => {
  if (stats.value?.totalRoles !== undefined && stats.value?.totalRoles !== null) return stats.value.totalRoles;
  if (data.value?.platformOverview?.totalRoles !== undefined && data.value?.platformOverview?.totalRoles !== null) return data.value.platformOverview.totalRoles;
  return null;
});

const totalAuditLogsCount = computed(() => {
  if (stats.value?.totalAuditLogs !== undefined && stats.value?.totalAuditLogs !== null) return stats.value.totalAuditLogs;
  if (data.value?.platformOverview?.totalAuditLogs !== undefined && data.value?.platformOverview?.totalAuditLogs !== null) return data.value.platformOverview.totalAuditLogs;
  return null;
});

const priorityCounts = computed(() => {
  const d = data.value;
  if (!d) return null;
  if (d.panels?.alertsByPriority) return d.panels.alertsByPriority;
  if (d.alertsByPriority) return d.alertsByPriority;
  if (d.platformOverview) {
    return {
      critical: d.platformOverview.criticalAlertsCount ?? 0,
      high: 0,
      medium: 0,
      low: 0,
    };
  }
  return null;
});

const priorityTotal = computed(() => {
  if (!priorityCounts.value) return null;
  const p = priorityCounts.value;
  return (p.critical || 0) + (p.high || 0) + (p.medium || 0) + (p.low || 0);
});

const priorityPct = (count) => {
  if (!priorityTotal.value || !count) return 0;
  return Math.round((count / priorityTotal.value) * 100);
};

const priorityBarWidth = (count) => {
  if (!priorityTotal.value || !count) return '0%';
  const rawPct = (count / priorityTotal.value) * 100;
  return `${Math.max(rawPct, 8)}%`;
};

// Attention items normalized
const attentionItems = computed(() => {
  const d = data.value;
  if (!d) return null;
  if (d.panels?.lowStockItems) return d.panels.lowStockItems;
  if (d.itemsNeedingAttention?.outOfStockItems) {
    return d.itemsNeedingAttention.outOfStockItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      currentStock: 0,
      reorderPoint: '—',
      status: 'out_of_stock',
    }));
  }
  return [];
});

// Recent stock movements (real ledger rows from the backend)
const OUTFLOW = ['stock_out', 'damaged', 'missing'];
const recentMovements = computed(() => {
  const d = data.value;
  if (!d) return null;
  const rows = d.panels?.recentMovements || d.recentMovements || [];
  return rows.map((m) => ({
    ...m,
    direction: OUTFLOW.includes(m.movement_type) || (m.movement_type === 'adjustment' && m.quantity < 0) ? 'out' : 'in',
    date_created: m.date_recorded,
  }));
});

const onRefresh = () => {
  dashStore.fetchDashboard(true).catch(() => {});
};

onMounted(() => {
  dashStore.fetchDashboard().catch(() => {});
});
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header & Platform Greeting -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            Platform Administration
          </span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Platform
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          GOOD DAY,
        </h1>
        <p class="text-sm font-medium text-slate-600 dark:text-slate-300">
          Welcome back, <span class="font-bold text-slate-900 dark:text-white">{{ adminName }}</span>. Here's an overview of your platform operations and inventory telemetry today.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          @click="onRefresh"
          :disabled="dashStore.loading"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-xs disabled:opacity-50"
        >
          <svg
            :class="['w-4 h-4', dashStore.loading ? 'animate-spin text-indigo-600' : 'text-slate-500']"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ dashStore.loading ? 'Updating...' : 'Sync Telemetry' }}</span>
        </button>

        <RouterLink
          to="/super-admin/users"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs"
        >
          <span>Platform Accounts</span>
          <span>→</span>
        </RouterLink>
      </div>
    </div>

    <!-- Error State Alert with Retry -->
    <div
      v-if="error"
      class="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 flex items-center justify-between gap-4"
      role="alert"
    >
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="text-sm font-medium text-rose-800 dark:text-rose-200">{{ error }}</span>
      </div>
      <button
        type="button"
        @click="onRefresh"
        class="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded bg-rose-600 text-white hover:bg-rose-700 transition"
      >
        Retry
      </button>
    </div>

    <!-- Platform Telemetry Banner -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900 text-white shadow-md">
      <div class="px-3 py-2 border-r border-slate-800 last:border-0">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform Status</span>
        <p class="text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500" />
          {{ platformStatusDisplay }}
        </p>
      </div>
      <div class="px-3 py-2 border-r border-slate-800 last:border-0">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
        <p class="text-base font-bold text-white mt-0.5">
          {{ num(totalUsersCount) }}
        </p>
      </div>
      <div class="px-3 py-2 border-r border-slate-800 last:border-0">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Global Roles</span>
        <p class="text-base font-bold text-white mt-0.5">
          {{ num(totalRolesCount) }}
        </p>
      </div>
      <div class="px-3 py-2">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Audit Journal</span>
        <p class="text-base font-bold text-indigo-300 mt-0.5">
          {{ totalAuditLogsCount !== null && totalAuditLogsCount !== undefined ? `${num(totalAuditLogsCount)} records` : '--' }}
        </p>
      </div>
    </div>

    <!-- Skeletons Loading View for Metrics -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton v-for="i in 8" :key="i" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <Skeleton class="h-5 w-36" />
          <div class="space-y-3 pt-2">
            <Skeleton v-for="i in 4" :key="i" class="h-7 w-full" />
          </div>
        </div>
        <div class="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Skeleton class="h-5 w-48 mb-4" />
          <TableSkeleton :rows="5" :cols="5" />
        </div>
      </div>
      <div class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <Skeleton class="h-5 w-56 mb-4" />
        <TableSkeleton :rows="4" :cols="5" />
      </div>
    </div>

    <!-- Loaded Real Operational Metric Cards & Panels -->
    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Catalog Products"
          :value="num(cards?.totalProducts)"
          subtitle="Active platform SKUs"
          icon="▦"
        />
        <StatCard
          title="Stock Valuation"
          :value="peso(cards?.totalValue)"
          subtitle="Aggregate inventory capital"
          icon="₱"
        />
        <StatCard
          title="Total Stock Units"
          :value="num(cards?.totalQuantity)"
          subtitle="Physical on-hand inventory"
          icon="📦"
        />
        <StatCard
          title="Low Stock Alert"
          :value="num(cards?.lowStock)"
          subtitle="Products below reorder threshold"
          icon="⚠"
          accent="warning"
        />
        <StatCard
          title="Out of Stock"
          :value="num(cards?.outOfStock)"
          subtitle="Depleted catalog items"
          icon="⛔"
          accent="danger"
        />
        <StatCard
          title="Reorder Due"
          :value="num(cards?.reorderDue)"
          subtitle="Suppliers pending PO action"
          icon="🔄"
          accent="info"
        />
        <StatCard
          title="Active Suppliers"
          :value="num(cards?.activeSuppliers)"
          subtitle="Verified vendor network"
          icon="⛟"
        />
        <StatCard
          title="Platform Users"
          :value="num(cards?.totalUsers)"
          subtitle="Authorized operational seats"
          icon="👥"
        />
      </div>

      <!-- Alert Distribution and Low Stock Attention Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Priority Distribution Graph -->
        <div class="lg:col-span-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Alerts by Priority
              </h2>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {{ priorityTotal !== null ? `${priorityTotal} Active` : '--' }}
              </span>
            </div>

            <div class="mt-4 space-y-3.5">
              <!-- Critical -->
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-rose-600 dark:text-rose-400">Critical</span>
                  <span class="text-slate-700 dark:text-slate-300">
                    {{ priorityCounts ? num(priorityCounts.critical) : '--' }}
                    <template v-if="priorityCounts && priorityTotal > 0"> ({{ priorityPct(priorityCounts.critical) }}%)</template>
                  </span>
                </div>
                <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div class="h-full bg-rose-500 rounded-full transition-all duration-300" :style="{ width: priorityBarWidth(priorityCounts?.critical) }" />
                </div>
              </div>

              <!-- High -->
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-amber-600 dark:text-amber-400">High</span>
                  <span class="text-slate-700 dark:text-slate-300">
                    {{ priorityCounts ? num(priorityCounts.high) : '--' }}
                    <template v-if="priorityCounts && priorityTotal > 0"> ({{ priorityPct(priorityCounts.high) }}%)</template>
                  </span>
                </div>
                <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full transition-all duration-300" :style="{ width: priorityBarWidth(priorityCounts?.high) }" />
                </div>
              </div>

              <!-- Medium -->
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-blue-600 dark:text-blue-400">Medium</span>
                  <span class="text-slate-700 dark:text-slate-300">
                    {{ priorityCounts ? num(priorityCounts.medium) : '--' }}
                    <template v-if="priorityCounts && priorityTotal > 0"> ({{ priorityPct(priorityCounts.medium) }}%)</template>
                  </span>
                </div>
                <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full transition-all duration-300" :style="{ width: priorityBarWidth(priorityCounts?.medium) }" />
                </div>
              </div>

              <!-- Low -->
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-500 dark:text-slate-400">Low</span>
                  <span class="text-slate-700 dark:text-slate-300">
                    {{ priorityCounts ? num(priorityCounts.low) : '--' }}
                    <template v-if="priorityCounts && priorityTotal > 0"> ({{ priorityPct(priorityCounts.low) }}%)</template>
                  </span>
                </div>
                <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div class="h-full bg-slate-400 rounded-full transition-all duration-300" :style="{ width: priorityBarWidth(priorityCounts?.low) }" />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <RouterLink
              to="/super-admin/logs"
              class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between"
            >
              <span>Review System Audit Trail</span>
              <span>→</span>
            </RouterLink>
          </div>
        </div>

        <!-- Critical Stock Attention Table -->
        <div class="lg:col-span-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Attention Items & Stock Depletion
            </h2>
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ attentionItems !== null ? `${attentionItems.length} flagged` : '--' }}
            </span>
          </div>

          <div v-if="!attentionItems || !attentionItems.length" class="py-12 text-center text-slate-400 text-xs">
            No stock replenishment flags active at this time.
          </div>

          <div v-else class="mt-3 overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th class="py-2 font-semibold">Product Name</th>
                  <th class="py-2 font-semibold">SKU</th>
                  <th class="py-2 font-semibold text-right">On Hand</th>
                  <th class="py-2 font-semibold text-right">Reorder Point</th>
                  <th class="py-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr
                  v-for="item in (attentionItems || []).slice(0, 5)"
                  :key="item.productId"
                  class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                >
                  <td class="py-2.5 font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
                    {{ item.productName }}
                  </td>
                  <td class="py-2.5 font-mono text-slate-500 dark:text-slate-400">
                    {{ item.sku }}
                  </td>
                  <td class="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                    {{ item.currentStock }}
                  </td>
                  <td class="py-2.5 text-right text-slate-500 dark:text-slate-400">
                    {{ item.reorderPoint }}
                  </td>
                  <td class="py-2.5 text-right">
                    <StatusBadge :status="item.status" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent System Movements Stream -->
      <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Recent Inventory Movements Stream
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Operational inbound and outbound ledger transactions
            </p>
          </div>
        </div>

        <div v-if="!recentMovements || !recentMovements.length" class="py-12 text-center text-slate-400 text-xs">
          No recent stock ledger movements recorded.
        </div>

        <div v-else class="mt-3 overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th class="py-2 font-semibold">Product</th>
                <th class="py-2 font-semibold">SKU</th>
                <th class="py-2 font-semibold">Movement Type</th>
                <th class="py-2 font-semibold text-right">Quantity</th>
                <th class="py-2 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="mov in (recentMovements || []).slice(0, 5)"
                :key="mov.movement_id"
                class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
              >
                <td class="py-2.5 font-medium text-slate-900 dark:text-white">
                  {{ mov.product?.product_name || 'Item' }}
                </td>
                <td class="py-2.5 font-mono text-slate-500 dark:text-slate-400">
                  {{ mov.product?.sku || '—' }}
                </td>
                <td class="py-2.5">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                      mov.direction === 'in' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      mov.direction === 'out' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    ]"
                  >
                    {{ mov.movement_type.replace(/_/g, ' ') }}
                  </span>
                </td>
                <td class="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {{ mov.direction === 'out' ? '-' : '+' }}{{ Math.abs(mov.quantity) }}
                </td>
                <td class="py-2.5 text-right text-slate-500 dark:text-slate-400">
                  {{ when(mov.date_created) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
