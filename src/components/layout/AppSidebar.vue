<script setup>
import AppLogo from '@/components/brand/AppLogo.vue';
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({ mobileOpen: { type: Boolean, default: false } });
const emit = defineEmits(['close']);

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

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

const initials = computed(() => {
  const name = auth.user?.fullName || auth.user?.name || 'Staff User';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
});

const SECTIONS = [
  {
    heading: 'Overview',
    items: [
      { to: '/dashboard', label: 'Operations Dashboard', icon: '📊', permission: null },
    ],
  },
  {
    heading: 'Warehouse Operations',
    items: [
      { to: '/inventory', label: 'Inventory Catalog', icon: '📦', permission: 'inventory.view' },
      { to: '/movements', label: 'Stock Movements', icon: '🔄', permission: 'movements.view' },
      { to: '/alerts', label: 'Alerts & Reorders', icon: '🚨', permission: 'alerts.view' },
      { to: '/suppliers', label: 'Suppliers Directory', icon: '🚚', permission: 'suppliers.view' },
    ],
  },
  {
    heading: 'Analytics',
    items: [
      { to: '/reports', label: 'Reports & Analytics', icon: '📈', anyOf: ['reports.view', 'reports.generate'] },
      { to: '/finance', label: 'Financial Valuation', icon: '💰', permission: 'finance.view', anyOf: ['reports.view', 'reports.generate'] },
    ],
  },
  {
    heading: 'Management',
    items: [
      { to: '/staff', label: 'Staff Operations', icon: '👥', permission: 'staff.view' },
      { to: '/users', label: 'User Accounts', icon: '⚙️', permission: 'users.view' },
      { to: '/roles', label: 'Roles & Permissions', icon: '🏷️', anyOf: ['roles.view', 'roles.manage'] },
      { to: '/activity', label: 'Audit Trail Logs', icon: '📜', permission: 'logs.view' },
    ],
  },
];

const sections = computed(() =>
  SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => (!i.permission || auth.can(i.permission)) && (!i.anyOf || auth.canAny(...i.anyOf))),
  })).filter((s) => s.items.length)
);

const isItemActive = (path) => {
  if (path === '/dashboard') return route.path === '/dashboard';
  return route.path === path || route.path.startsWith(path + '/');
};

const onSignOut = async () => {
  await auth.logout();
  router.replace({ name: 'login' });
};

const onKeyDown = (e) => {
  if (e.key === 'Escape' && props.mobileOpen) emit('close');
};

const onResize = () => {
  if (window.innerWidth >= 1024 && props.mobileOpen) emit('close');
};

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <!-- Mobile drawer backdrop -->
  <Transition
    enter-active-class="transition-opacity ease-linear duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity ease-linear duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
      aria-hidden="true"
      @click="emit('close')"
    />
  </Transition>

  <aside
    :class="[
      'fixed lg:sticky top-0 z-50 h-screen w-64 shrink-0 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xl lg:shadow-none',
      mobileOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
    style="background-color: #101A27;"
    aria-label="Operations Navigation"
  >
    <!-- Brand Header -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0 bg-[#0C1420]">
      <RouterLink to="/dashboard" class="flex items-center gap-2.5 min-w-0" @click="emit('close')">
        <AppLogo :size="34" />
        <div class="min-w-0">
          <p class="text-[13px] font-extrabold tracking-[0.06em] text-white leading-tight whitespace-nowrap">
            WALANG BROWNOUT
          </p>
          <p class="text-xs font-semibold text-sky-400 tracking-wide truncate mt-0.5">
            Appliances
          </p>
        </div>
      </RouterLink>

      <button
        type="button"
        class="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
        @click="emit('close')"
        aria-label="Close navigation drawer"
      >
        ✕
      </button>
    </div>

    <!-- Workspace Scope Ribbon -->
    <div class="px-4 py-2 border-b border-slate-800/60 bg-[#0E1724] flex items-center justify-between">
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        <span class="text-[10px] font-semibold text-slate-300 truncate">
          {{ auth.tenantName }}
        </span>
      </div>
      <span class="text-[9px] font-mono text-slate-400 uppercase tracking-wider bg-slate-800/80 px-1.5 py-0.5 rounded">
        Active
      </span>
    </div>

    <!-- Navigation links -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-5" role="navigation">
      <div v-for="(section, si) in sections" :key="si" class="space-y-1">
        <p class="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {{ section.heading }}
        </p>
        <ul class="mt-1 space-y-0.5">
          <li v-for="item in section.items" :key="item.to">
            <RouterLink
              :to="item.to"
              @click="emit('close')"
              :aria-current="isItemActive(item.to) ? 'page' : undefined"
              :class="[
                'group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                isItemActive(item.to)
                  ? 'bg-sky-500/10 text-sky-300 font-semibold border-l-2 border-sky-400 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 hover:translate-x-1'
              ]"
            >
              <span class="text-sm shrink-0 select-none opacity-80 group-hover:opacity-100 transition-transform duration-200 group-hover:scale-110">{{ item.icon }}</span>
              <span class="flex-1 truncate">{{ item.label }}</span>
              <span
                v-if="isItemActive(item.to)"
                class="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"
                aria-hidden="true"
              />
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- User Profile Footer with Role Icon + Name -->
    <div class="p-3 border-t border-slate-800/80 shrink-0 bg-[#0C1420]">
      <div class="rounded-xl bg-[#131F30] border border-slate-800 p-2.5 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center text-xs font-bold shrink-0">
            {{ initials }}
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold text-white truncate leading-tight">
              {{ auth.user?.fullName }}
            </p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                <span>{{ roleInfo.icon }}</span>
                <span>{{ roleInfo.text }}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="onSignOut"
          class="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition shrink-0"
          title="Sign out of Operations"
          aria-label="Sign out"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>
