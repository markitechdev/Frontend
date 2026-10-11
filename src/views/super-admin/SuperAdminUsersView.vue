<script setup>
import { ref, onMounted, computed } from 'vue';
import { superAdminApi } from '@/api';
import TableSkeleton from '@/components/ui/TableSkeleton.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { useToastStore } from '@/stores/toast';

const toast = useToastStore();
const users = ref([]);
const loading = ref(true);
const error = ref(null);
const search = ref('');

const fetchUsers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await superAdminApi.users.list();
    users.value = Array.isArray(res) ? res : res?.users || [];
  } catch (e) {
    error.value = e.message || 'Unable to retrieve platform user accounts.';
  } finally {
    loading.value = false;
  }
};

const filteredUsers = computed(() => {
  if (!search.value.trim()) return users.value;
  const q = search.value.toLowerCase();
  return users.value.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.role?.role_name?.toLowerCase().includes(q)
  );
});

onMounted(fetchUsers);
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- View Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            Platform Governance
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Cross-Tenant Scope
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Platform User Accounts
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Global directory of administrators, operational supervisors, and tenant accounts.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="fetchUsers"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-xs"
        >
          <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin text-indigo-600' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
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
        @click="fetchUsers"
        class="px-3 py-1 text-xs font-bold uppercase rounded bg-rose-600 text-white hover:bg-rose-700 transition"
      >
        Retry
      </button>
    </div>

    <!-- Table Card -->
    <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <!-- Toolbar -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="relative w-full sm:w-72">
          <input
            v-model="search"
            type="search"
            placeholder="Search platform users..."
            class="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Showing {{ filteredUsers.length }} of {{ users.length }} users
        </span>
      </div>

      <!-- Loading Skeleton -->
      <TableSkeleton v-if="loading" :rows="5" :cols="5" class="p-4" />

      <!-- Empty State -->
      <div v-else-if="!filteredUsers.length" class="py-16 text-center text-slate-400">
        <p class="text-sm font-semibold">No platform accounts found</p>
        <p class="text-xs mt-1">Try modifying your search criteria.</p>
      </div>

      <!-- Users Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-3 px-4 font-semibold">User</th>
              <th class="py-3 px-4 font-semibold">Username</th>
              <th class="py-3 px-4 font-semibold">Role & Permissions</th>
              <th class="py-3 px-4 font-semibold">Position</th>
              <th class="py-3 px-4 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="u in filteredUsers"
              :key="u.user_id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                    {{ (u.full_name || 'U')[0].toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-900 dark:text-white">{{ u.full_name }}</p>
                    <p class="text-[11px] text-slate-400">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                @{{ u.username }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                    u.role?.role_code === 'super_admin'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                  ]"
                >
                  {{ u.role?.role_name || u.role?.role_code || 'User' }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                {{ u.position || '—' }}
              </td>
              <td class="py-3 px-4 text-right">
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                    u.is_active !== false
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  ]"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="u.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'" />
                  {{ u.is_active !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
