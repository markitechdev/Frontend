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
    heading: 'Core Platform',
    items: [
      {
        to: '/super-admin/dashboard',
        label: 'Platform Overview',
        icon: '📊',
        description: 'System telemetry & KPI overview',
      },
    ],
  },
  {
    heading: 'Access & Governance',
    items: [
      {
        to: '/super-admin/users',
        label: 'Platform Users',
        icon: '👥',
        description: 'Tenant admins & system accounts',
      },
      {
        to: '/super-admin/roles',
        label: 'Roles & Clearance',
        icon: '🛡️',
        description: 'Global capability matrix',
      },
    ],
  },
  {
    heading: 'Multi-Tenancy & Audit',
    items: [
      {
        to: '/super-admin/tenants',
        label: 'Client Tenants',
        icon: '🏢',
        description: 'Workspace partition isolation',
      },
      {
        to: '/super-admin/logs',
        label: 'System Audit Logs',
        icon: '📜',
        description: 'Security & compliance journal',
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
    <!-- Mobile Backdrop -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    />

    <!-- Super Admin Dedicated Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-0 max-lg:-translate-x-full',
      ]"
      style="background-color: #0F1B2D;"
      aria-label="Platform Administration Navigation"
    >
      <!-- Brand & Platform Header -->
      <div class="flex items-center justify-between h-16 px-5 border-b border-slate-800/80">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-950 font-bold text-sm">
            SA
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold tracking-wide text-white leading-tight">
              IMS PLATFORM
            </span>
            <span class="text-[10px] font-medium tracking-wider text-indigo-400 uppercase">
              Root Administration
            </span>
          </div>
        </div>

        <button
          type="button"
          class="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          @click="emit('close')"
          aria-label="Close navigation sidebar"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div v-for="(group, gIdx) in SECTIONS" :key="gIdx" class="space-y-1">
          <p class="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {{ group.heading }}
          </p>
          <ul class="mt-2 space-y-1">
            <li v-for="item in group.items" :key="item.to">
              <RouterLink
                :to="item.to"
                @click="emit('close')"
                :class="[
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  route.path === item.to || route.path.startsWith(item.to + '/')
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                ]"
              >
                <span class="text-base select-none">{{ item.icon }}</span>
                <span class="flex-1 truncate">{{ item.label }}</span>
                <span
                  v-if="route.path === item.to || route.path.startsWith(item.to + '/')"
                  class="w-1.5 h-1.5 rounded-full bg-white"
                  aria-hidden="true"
                />
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Super Admin Profile Card (Bottom) -->
      <div class="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div class="flex items-center gap-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <div class="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
            {{ initials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-white truncate">
              {{ auth.user?.fullName || auth.user?.name || 'Super Admin' }}
            </p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="inline-flex items-center px-1.5 py-0.2 text-[9px] font-semibold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                Super Admin
              </span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Session active" />
            </div>
          </div>
          <button
            type="button"
            @click="onLogout"
            class="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition shrink-0"
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
