<script setup>
import { ref, onMounted } from 'vue';
import { superAdminApi } from '@/api';
import TableSkeleton from '@/components/ui/TableSkeleton.vue';

const roles = ref([]);
const permissions = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [rolesRes, permsRes] = await Promise.all([
      superAdminApi.roles.list(),
      superAdminApi.roles.permissions().catch(() => []),
    ]);
    roles.value = rolesRes || [];
    permissions.value = permsRes || [];
  } catch (e) {
    error.value = e.message || 'Unable to retrieve platform roles and matrix.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            Platform Governance
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Authorization Matrix
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Roles & Clearance Hierarchy
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Global capability matrix mapping roles to tenant and platform boundaries.
        </p>
      </div>

      <button
        type="button"
        @click="fetchData"
        :disabled="loading"
        class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-xs"
      >
        <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin text-indigo-600' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh Matrix</span>
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
        @click="fetchData"
        class="px-3 py-1 text-xs font-bold uppercase rounded bg-rose-600 text-white hover:bg-rose-700 transition"
      >
        Retry
      </button>
    </div>

    <TableSkeleton v-if="loading" :rows="4" :cols="3" class="p-4 bg-white dark:bg-slate-900 rounded-xl" />

    <!-- Roles Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="role in roles"
        :key="role.role_id"
        class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span class="text-xs font-mono font-semibold text-slate-400">
              #{{ role.role_id }}
            </span>
            <span
              :class="[
                'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                role.role_code === 'super_admin'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
              ]"
            >
              {{ role.role_code }}
            </span>
          </div>

          <h3 class="text-base font-bold text-slate-900 dark:text-white mt-3">
            {{ role.role_name }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {{ role.description || 'System operational clearance level.' }}
          </p>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Authoritative Scope</span>
          <span class="font-semibold text-slate-700 dark:text-slate-300">
            {{ role.role_code === 'super_admin' ? 'Universal Platform' : 'Tenant Isolated' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
