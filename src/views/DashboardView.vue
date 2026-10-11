<script setup>
import { ref, onMounted, computed } from 'vue';
import { dashboardApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { useDashboardStore } from '@/stores/dashboard';
import StatCard from '@/components/ui/StatCard.vue';
import StatCardSkeleton from '@/components/ui/StatCardSkeleton.vue';
import Skeleton from '@/components/ui/Skeleton.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const auth = useAuthStore();
const toast = useToastStore();

const data = ref(null);
const loading = ref(true);
const error = ref(null);

const peso = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num  = (n) => Number(n || 0).toLocaleString();
const when = (d) => new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const cards   = computed(() => data.value?.cards ?? {});
const panels  = computed(() => data.value?.panels ?? {});


const priorityPct = (count) => {
  if (!priorityTotal.value || !count) return 0;
  return Math.round((count / priorityTotal.value) * 100);
};

const priorityBarWidth = (count) => {
  if (!priorityTotal.value || !count) return '0%';
  const rawPct = (count / priorityTotal.value) * 100;
  return `${Math.max(3, rawPct)}%`;
};

const priorityTotal = computed(() => {
  const p = panels.value.alertsByPriority || {};
  return (p.critical || 0) + (p.high || 0) + (p.medium || 0) + (p.low || 0);
});

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
    <!-- header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">{{ auth.roleName }} Dashboard</h2>
        <p class="text-sm text-slate-500">Welcome back, {{ auth.user?.fullName }}.</p>
      </div>
      <button class="btn-ghost btn-sm" :disabled="dashboardStore.loading" @click="load(true)">
        {{ dashboardStore.loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <!-- loading skeleton state -->
    <div v-if="loading" class="space-y-6">
      <div class="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCardSkeleton v-for="i in 5" :key="`sc-skel-${i}`" />
      </div>
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="card p-5 lg:col-span-2 space-y-4 border-slate-200">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <Skeleton width="180px" height="1.25rem" />
            <Skeleton width="60px" height="0.875rem" />
          </div>
          <div class="space-y-3 pt-2">
            <div v-for="j in 4" :key="`row-skel-${j}`" class="flex justify-between items-center py-2">
              <Skeleton width="35%" height="1rem" />
              <Skeleton width="20%" height="1rem" />
              <Skeleton width="15%" height="1rem" />
            </div>
          </div>
        </div>
        <div class="card p-5 space-y-4 border-slate-200">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <Skeleton width="140px" height="1.25rem" />
            <Skeleton width="50px" height="0.875rem" />
          </div>
          <div class="space-y-3 pt-2">
            <div v-for="k in 4" :key="`bar-skel-${k}`" class="space-y-1.5 py-1">
              <div class="flex justify-between">
                <Skeleton width="60px" height="0.875rem" />
                <Skeleton width="30px" height="0.875rem" />
              </div>
              <Skeleton width="100%" height="0.5rem" rounded="rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- error state with retry -->
    <div v-else-if="error" class="card p-8 border-red-200 bg-red-50/30 text-center space-y-3">
      <div class="h-12 w-12 rounded-full bg-red-100 text-red-600 mx-auto grid place-items-center text-xl font-bold">
        ⚠
      </div>
      <h3 class="text-base font-semibold text-slate-800">Failed to load dashboard metrics</h3>
      <p class="text-sm text-slate-600 max-w-md mx-auto">{{ error }}</p>
      <div class="pt-2">
        <button class="btn-primary btn-sm" @click="load">Try Again</button>
      </div>
    </div>

    <template v-else>
      <!-- stat cards -->
      <div class="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard v-if="cards.totalProducts !== undefined"
                  label="Total Products" :value="num(cards.totalProducts)"
                  :sublabel="`${num(cards.totalQuantity)} units on hand`" tone="blue" />
        <StatCard v-if="cards.lowStock !== undefined"
                  label="Low Stock" :value="num(cards.lowStock)" sublabel="At or below minimum" tone="amber" />
        <StatCard v-if="cards.outOfStock !== undefined"
                  label="Out of Stock" :value="num(cards.outOfStock)" sublabel="Needs immediate restock" tone="red" />
        <StatCard v-if="cards.reorderDue !== undefined"
                  label="Reorder Due" :value="num(cards.reorderDue)" sublabel="At reorder point" tone="blue" />
        <StatCard v-if="cards.activeAlerts !== undefined"
                  label="Active Alerts" :value="num(cards.activeAlerts)" sublabel="Awaiting action" tone="red" />
        <StatCard v-if="cards.totalValue !== undefined"
                  label="Stock Value" :value="peso(cards.totalValue)" sublabel="Current inventory valuation" tone="green" />
        <StatCard v-if="cards.shrinkageUnits30d !== undefined"
                  label="Shrinkage (30d)" :value="num(cards.shrinkageUnits30d)"
                  :sublabel="`${peso(cards.shrinkageValue30d)} lost`" tone="amber" />
        <StatCard v-if="cards.activeSuppliers !== undefined"
                  label="Active Suppliers" :value="num(cards.activeSuppliers)" tone="default" />
        <StatCard v-if="cards.totalUsers !== undefined"
                  label="Active Users" :value="num(cards.totalUsers)" sublabel="Across all roles" tone="default" />
      </div>

      <!-- finance notice -->
      <div v-if="panels.financeNotice"
           class="card p-4 border-l-4 border-l-amber-400 bg-amber-50/50">
        <p class="text-sm font-semibold text-slate-800">Finance module — planned</p>
        <p class="text-sm text-slate-600 mt-1">{{ panels.financeNotice.message }}</p>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <!-- recent movements -->
        <div v-if="panels.recentMovements" class="card lg:col-span-2">
          <div class="card-header">
            <h3 class="card-title">Recent Stock Movements</h3>
            <RouterLink to="/movements" class="text-xs font-medium text-navy-600 hover:underline">View all</RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr><th>Date</th><th>Product</th><th>Type</th><th class="text-right">Qty</th><th>By</th></tr>
              </thead>
              <tbody>
                <tr v-if="!panels.recentMovements.length">
                  <td colspan="5" class="text-center py-8 text-slate-400">No movements recorded yet.</td>
                </tr>
                <tr v-for="m in panels.recentMovements" :key="m.movement_id">
                  <td class="text-xs text-slate-500 whitespace-nowrap">{{ when(m.date_recorded) }}</td>
                  <td>
                    <p class="font-medium text-slate-800">{{ m.product?.product_name }}</p>
                    <p class="text-xs text-slate-400">{{ m.product?.sku }}</p>
                  </td>
                  <td><StatusBadge :status="m.movement_type" /></td>
                  <td class="text-right font-semibold tabular-nums">{{ m.quantity }}</td>
                  <td class="text-xs text-slate-500">{{ m.recorded_by_user?.full_name || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- alerts by priority -->
        <div v-if="panels.alertsByPriority" class="card">
          <div class="card-header">
            <h3 class="card-title">Alerts by Priority</h3>
            <RouterLink to="/alerts" class="text-xs font-medium text-navy-600 hover:underline">View all</RouterLink>
          </div>
          <div class="card-body space-y-3.5">
            <div
              v-for="(count, level) in panels.alertsByPriority"
              :key="level"
              class="group relative"
              :title="`${level.toUpperCase()}: ${count} alert(s) (${priorityPct(count)}% of total)`"
            >
              <div class="flex items-center justify-between text-sm mb-1.5">
                <StatusBadge :status="level" />
                <div class="flex items-center gap-1.5 tabular-nums">
                  <span class="text-xs text-slate-400">({{ priorityPct(count) }}%)</span>
                  <span class="font-semibold text-slate-700">{{ count }}</span>
                </div>
              </div>
              <div class="h-2 rounded-full bg-slate-100 overflow-hidden relative">
                <div
                  class="h-full rounded-full transition-all duration-500 ease-out"
                  :class="{
                    'bg-red-500': level === 'critical',
                    'bg-amber-500': level === 'high',
                    'bg-blue-500': level === 'medium',
                    'bg-slate-400': level === 'low'
                  }"
                  :style="{ width: priorityBarWidth(count) }"
                />
              </div>
            </div>
            <p v-if="!priorityTotal" class="text-sm text-slate-400 text-center py-2">No active alerts.</p>
          </div>
        </div>

        <!-- low stock -->
        <div v-if="panels.lowStockItems" class="card lg:col-span-2">
          <div class="card-header">
            <h3 class="card-title">Items Needing Attention</h3>
            <RouterLink to="/inventory" class="text-xs font-medium text-navy-600 hover:underline">Open inventory</RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr><th>SKU</th><th>Product</th><th class="text-right">Stock</th><th class="text-right">Reorder</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr v-if="!panels.lowStockItems.length">
                  <td colspan="5" class="text-center py-8 text-slate-400">Everything is above its minimum level.</td>
                </tr>
                <tr v-for="it in panels.lowStockItems" :key="it.productId">
                  <td class="font-mono text-xs text-slate-500">{{ it.sku }}</td>
                  <td class="font-medium text-slate-800">{{ it.productName }}</td>
                  <td class="text-right font-semibold tabular-nums">{{ it.currentStock }}</td>
                  <td class="text-right tabular-nums text-slate-500">{{ it.reorderPoint }}</td>
                  <td><StatusBadge :status="it.status" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- users by role -->
        <div v-if="panels.usersByRole" class="card">
          <div class="card-header"><h3 class="card-title">Users by Role</h3></div>
          <div class="card-body space-y-2.5">
            <div v-for="r in panels.usersByRole" :key="r.roleCode"
                 class="flex items-center justify-between text-sm">
              <span class="text-slate-600">{{ r.roleName }}</span>
              <span class="badge-gray tabular-nums">{{ r.count }}</span>
            </div>
          </div>
        </div>

        <!-- recent activity -->
        <div v-if="panels.recentActivity" class="card lg:col-span-3">
          <div class="card-header">
            <h3 class="card-title">Recent System Activity</h3>
            <RouterLink to="/activity" class="text-xs font-medium text-navy-600 hover:underline">View log</RouterLink>
          </div>
          <div class="card-body space-y-2">
            <div v-if="!panels.recentActivity.length" class="text-sm text-slate-400 text-center py-4">
              No activity recorded yet.
            </div>
            <div v-for="log in panels.recentActivity" :key="log.log_id"
                 class="flex items-center gap-3 text-sm py-1.5 border-b border-slate-50 last:border-0">
              <span class="badge-gray shrink-0">{{ log.action.replace(/_/g, ' ') }}</span>
              <span class="text-slate-600 truncate">{{ log.user?.full_name || 'System' }}</span>
              <span class="text-xs text-slate-400 ml-auto whitespace-nowrap">{{ when(log.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
