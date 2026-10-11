<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({ mobileOpen: { type: Boolean, default: false } });
const emit = defineEmits(['close']);

const auth = useAuthStore();

/**
 * Navigation items are strictly guarded by backend verified permissions.
 * Super Admin retains universal visibility across modules.
 */
const SECTIONS = [
  {
    heading: null,
    items: [{ to: '/dashboard', label: 'Dashboard', icon: '▦', permission: null }],
  },
  {
    heading: 'Warehouse Operations',
    items: [
      { to: '/inventory', label: 'Inventory',       icon: '▤', permission: 'inventory.view' },
      { to: '/movements', label: 'Stock Movements', icon: '⇄', permission: 'movements.view' },
      { to: '/alerts',    label: 'Alerts & Reorders',icon: '⚠', permission: 'alerts.view' },
      { to: '/suppliers', label: 'Suppliers',       icon: '⛟', permission: 'suppliers.view' },
    ],
  },
  {
    heading: 'Personnel',
    items: [{ to: '/staff', label: 'Staff Operations', icon: '☺', permission: 'staff.view' }],
  },
  {
    heading: 'Accounting',
    items: [{ to: '/finance', label: 'Financial Records', icon: '₱', permission: 'finance.view' }],
  },
  {
    heading: 'Analytics',
    items: [{ to: '/reports', label: 'Reports & Analytics', icon: '◫', permission: 'reports.view' }],
  },
  {
    heading: 'Administration',
    items: [
      { to: '/users',    label: 'User Accounts',      icon: '◉', permission: 'users.view' },
      { to: '/roles',    label: 'Roles & Permissions',icon: '⚿', permission: 'roles.manage' },
      { to: '/activity', label: 'Audit Trail Logs',   icon: '≡', permission: 'logs.view' },
    ],
  },
];

const sections = computed(() =>
  SECTIONS
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.permission || auth.can(i.permission)),
    }))
    .filter((s) => s.items.length)
);

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
      class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
      aria-hidden="true"
      @click="emit('close')"
    />
  </Transition>

  <aside
    :class="[
      'fixed lg:sticky top-0 z-50 h-screen w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
      mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
    ]"
    aria-label="Sidebar Navigation"
  >
    <!-- Brand & Workspace Header -->
    <div class="h-16 flex items-center justify-between px-5 border-b border-slate-200 shrink-0 bg-slate-50/50">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="h-9 w-9 rounded-xl bg-navy-900 text-white grid place-items-center text-xs font-black shadow-sm shrink-0">
          IMS
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-slate-900 leading-tight truncate">Inventory System</p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="text-[10px] text-slate-500 font-medium truncate">{{ auth.tenantName }}</span>
            <span
              v-if="auth.isSuperAdmin"
              class="text-[9px] bg-purple-100 text-purple-800 font-bold px-1 rounded uppercase tracking-wider shrink-0"
            >
              Super
            </span>
          </div>
        </div>
      </div>

      <!-- Close button on mobile -->
      <button
        type="button"
        class="lg:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
        @click="emit('close')"
        aria-label="Close navigation drawer"
      >
        ✕
      </button>
    </div>

    <!-- Navigation links -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      <div v-for="(section, si) in sections" :key="si">
        <p
          v-if="section.heading"
          class="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
        >
          {{ section.heading }}
        </p>
        <div class="space-y-0.5">
          <RouterLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            active-class="nav-link-active"
            @click="emit('close')"
          >
            <span class="w-4 text-center opacity-70 text-xs">{{ item.icon }}</span>
            <span class="truncate">{{ item.label }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- User Profile Badge Footer -->
    <div class="p-3 border-t border-slate-200 shrink-0 bg-slate-50/60">
      <div class="rounded-xl bg-white border border-slate-200/80 p-2.5 shadow-2xs">
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs font-bold text-slate-800 truncate">{{ auth.user?.fullName }}</p>
          <span :class="['text-[10px] px-1.5 py-0.2 rounded font-medium', auth.isSuperAdmin ? 'badge-purple' : 'badge-gray']">
            {{ auth.roleName || 'Staff' }}
          </span>
        </div>
        <p class="text-[11px] text-slate-400 truncate">{{ auth.user?.email }}</p>
      </div>
    </div>
  </aside>
</template>
