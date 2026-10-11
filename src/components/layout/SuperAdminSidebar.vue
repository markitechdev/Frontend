<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  mobileOpen: { type: Boolean, default: false },
});
const emit = defineEmits(['close']);

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const SECTIONS = [
  {
    heading: 'Platform Telemetry',
    items: [
      {
        to: '/super-admin/dashboard',
        label: 'Platform Overview',
        icon: '▦',
        badge: 'Live',
      },
    ],
  },
  {
    heading: 'Platform Governance',
    items: [
      {
        to: '/super-admin/users',
        label: 'Platform Users',
        icon: '👥',
      },
      {
        to: '/super-admin/roles',
        label: 'Roles & Matrix',
        icon: '🛡️',
      },
    ],
  },
  {
    heading: 'Multi-Tenancy & Security',
    items: [
      {
        to: '/super-admin/tenants',
        label: 'Client Tenants',
        icon: '🏢',
      },
      {
        to: '/super-admin/logs',
        label: 'Platform Audit Logs',
        icon: '📜',
      },
    ],
  },
];

const initials = computed(() => {
  const name = auth.user?.fullName || auth.user?.name || 'Super Admin';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
});

const isItemActive = (path) => {
  if (path === '/super-admin/dashboard') {
    return route.path === '/super-admin/dashboard';
  }
  return route.path === path || route.path.startsWith(path + '/');
};

const onLogout = async () => {
  await auth.superAdminLogout();
  router.push({ name: 'super-admin-login' });
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.mobileOpen) {
    emit('close');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div>
    <!-- Mobile Backdrop with smooth fade -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
        @click="emit('close')"
        aria-hidden="true"
      />
    </Transition>

    <!-- Super Admin Dedicated Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-68 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shadow-2xl lg:shadow-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-0 max-lg:-translate-x-full',
      ]"
      style="background-color: #0F1B2D;"
      aria-label="Super Admin Platform Navigation"
    >
      <!-- Brand & Platform Banner -->
      <div class="flex items-center justify-between h-16 px-5 border-b border-slate-800/80 shrink-0">
        <RouterLink
          to="/super-admin/dashboard"
          class="flex items-center gap-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
        >
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-950 font-bold text-xs tracking-wider">
            SA
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold tracking-tight text-white leading-tight">
              IMS PLATFORM
            </span>
            <span class="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">
              Root Administration
            </span>
          </div>
        </RouterLink>

        <button
          type="button"
          class="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          @click="emit('close')"
          aria-label="Close navigation sidebar"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation Hierarchy -->
      <nav class="flex-1 px-3 py-4 space-y-6 overflow-y-auto" role="navigation">
        <div v-for="(group, gIdx) in SECTIONS" :key="gIdx" class="space-y-1">
          <p class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {{ group.heading }}
          </p>
          <ul class="mt-1.5 space-y-1">
            <li v-for="item in group.items" :key="item.to">
              <RouterLink
                :to="item.to"
                @click="emit('close')"
                :aria-current="isItemActive(item.to) ? 'page' : undefined"
                :class="[
                  'group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  isItemActive(item.to)
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                ]"
              >
                <span class="text-sm shrink-0 select-none opacity-85 group-hover:opacity-100">{{ item.icon }}</span>
                <span class="flex-1 truncate">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                >
                  {{ item.badge }}
                </span>
                <span
                  v-else-if="isItemActive(item.to)"
                  class="w-1.5 h-1.5 rounded-full bg-white shrink-0"
                  aria-hidden="true"
                />
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Super Admin Session Boundary Card (Footer) -->
      <div class="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
        <div class="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div class="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
            {{ initials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-white truncate">
              {{ auth.user?.fullName || auth.user?.name || 'Super Admin' }}
            </p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                Super Admin
              </span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Authoritative session active" />
            </div>
          </div>
          <button
            type="button"
            @click="onLogout"
            class="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition shrink-0 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            title="Sign out of Super Admin"
            aria-label="Sign out of Super Admin"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>
