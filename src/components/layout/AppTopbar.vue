<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const emit = defineEmits(['toggle-sidebar']);

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const menuOpen = ref(false);
const menuRef = ref(null);
const searchQuery = ref('');

const title = computed(() => route.meta?.title || 'Overview');

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
  else if (c === 'staff' || c === 'user') icon = '👤';
  else if (c) icon = '🧩';
  return { icon, text: name || (code ? code.toUpperCase() : 'Staff') };
};

const roleInfo = computed(() => getRoleDisplay(auth.roleCode, auth.roleName));

const initials = computed(() =>
  (auth.user?.fullName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
);

const onSearchSubmit = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/inventory', query: { search: searchQuery.value.trim() } });
  }
};

const onSignOut = async () => {
  menuOpen.value = false;
  await auth.logout();
  router.push({ name: 'login' });
};

const onClickOutside = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) menuOpen.value = false;
};

const onKeyDown = (e) => {
  if (e.key === 'Escape' && menuOpen.value) menuOpen.value = false;
};

onMounted(() => {
  document.addEventListener('click', onClickOutside);
  window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside);
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
    <!-- Left: Breadcrumb & Operational Context -->
    <div class="flex items-center gap-3 min-w-0">
      <button
        class="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
        @click="emit('toggle-sidebar')"
        aria-label="Toggle navigation drawer"
      >
        <span class="text-xl leading-none">☰</span>
      </button>

      <div class="min-w-0 flex items-center gap-2">
        <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
          Inventory Operations
        </span>
        <span class="hidden sm:inline text-slate-300 font-bold">/</span>
        <h1 class="text-sm sm:text-base font-extrabold text-slate-900 truncate tracking-tight">
          {{ title }}
        </h1>
      </div>
    </div>

    <!-- Center: Operational Quick Search Bar -->
    <div class="hidden md:flex items-center flex-1 max-w-sm mx-6">
      <form class="relative w-full" @submit.prevent="onSearchSubmit">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search inventory, SKU or supplier..."
          class="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition shadow-2xs"
        />
        <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </form>
    </div>

    <!-- Right: Alerts & User Profile Menu -->
    <div class="flex items-center gap-3 shrink-0">
      <RouterLink
        v-if="auth.can('alerts.view')"
        to="/alerts"
        class="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors relative"
        title="View Reorder & Expiry Alerts"
      >
        <span class="text-base leading-none">🔔</span>
      </RouterLink>

      <div ref="menuRef" class="relative">
        <button
          class="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
          @click.stop="menuOpen = !menuOpen"
          aria-haspopup="true"
          :aria-expanded="menuOpen"
        >
          <div class="h-8 w-8 rounded-lg bg-slate-900 text-sky-400 grid place-items-center text-xs font-bold shadow-2xs">
            {{ initials }}
          </div>
          <div class="hidden sm:block text-left">
            <p class="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
              {{ auth.user?.fullName }}
            </p>
            <div class="flex items-center gap-1 mt-0.5">
              <span class="text-[10px] text-slate-600 font-semibold">{{ roleInfo.icon }} {{ roleInfo.text }}</span>
            </div>
          </div>
          <span class="text-slate-400 text-xs hidden sm:inline">▾</span>
        </button>

        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div
            v-if="menuOpen"
            class="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-40 text-xs"
          >
            <div class="px-4 py-3 border-b border-slate-100">
              <p class="text-xs font-bold text-slate-900 truncate">{{ auth.user?.fullName }}</p>
              <p class="text-[11px] text-slate-500 font-mono truncate mt-0.5">{{ auth.user?.email }}</p>
              <div class="flex items-center gap-1.5 mt-2">
                <span class="badge-cyan">
                  <span>{{ roleInfo.icon }}</span>
                  <span>{{ roleInfo.text }}</span>
                </span>
              </div>
            </div>

            <div class="px-4 py-2 border-b border-slate-100 text-slate-500">
              <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">Workspace</span>
              <p class="font-semibold text-slate-800 truncate">{{ auth.tenantName }}</p>
            </div>

            <div class="p-1.5">
              <RouterLink
                to="/inventory"
                class="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                @click="menuOpen = false"
              >
                <span>📦</span>
                <span>Inventory Catalog</span>
              </RouterLink>
              <RouterLink
                v-if="auth.can('alerts.view')"
                to="/alerts"
                class="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                @click="menuOpen = false"
              >
                <span>🚨</span>
                <span>Active Alerts</span>
              </RouterLink>
              <button
                class="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors mt-1"
                @click="onSignOut"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>
