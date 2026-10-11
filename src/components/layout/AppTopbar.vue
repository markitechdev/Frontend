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

const title = computed(() => route.meta?.title || 'Overview');

const initials = computed(() =>
  (auth.user?.fullName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
);

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
  <header class="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
    <div class="flex items-center gap-3 min-w-0">
      <button
        class="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
        @click="emit('toggle-sidebar')"
        aria-label="Toggle navigation drawer"
      >
        <span class="text-xl leading-none">☰</span>
      </button>

      <div class="min-w-0 flex items-center gap-2">
        <h1 class="text-base sm:text-lg font-bold text-slate-900 truncate">{{ title }}</h1>
        <span class="hidden md:inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate">
          {{ auth.tenantName }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-3 shrink-0">
      <RouterLink
        v-if="auth.can('alerts.view')"
        to="/alerts"
        class="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors relative"
        title="View Reorder & Expiry Alerts"
      >
        <span class="text-lg leading-none">⚠</span>
      </RouterLink>

      <div ref="menuRef" class="relative">
        <button
          class="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-navy-400"
          @click.stop="menuOpen = !menuOpen"
          aria-haspopup="true"
          :aria-expanded="menuOpen"
        >
          <div class="h-8 w-8 rounded-full bg-navy-900 text-white grid place-items-center text-xs font-bold shadow-xs">
            {{ initials }}
          </div>
          <div class="hidden sm:block text-left">
            <p class="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">{{ auth.user?.fullName }}</p>
            <p class="text-[10px] text-slate-500 leading-tight">{{ auth.roleName }}</p>
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
            class="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-40"
          >
            <div class="px-4 py-3 border-b border-slate-100">
              <p class="text-sm font-bold text-slate-800 truncate">{{ auth.user?.fullName }}</p>
              <p class="text-xs text-slate-500 truncate">{{ auth.user?.email }}</p>
              <div class="flex items-center gap-1.5 mt-2">
                <span class="badge-gray">{{ auth.roleName }}</span>
                <span v-if="auth.isSuperAdmin" class="badge-purple">Super Admin</span>
              </div>
            </div>
            <div class="px-4 py-2 border-b border-slate-100 text-xs text-slate-500">
              <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Workspace</span>
              <p class="font-medium text-slate-700 truncate">{{ auth.tenantName }}</p>
            </div>
            <div class="p-1.5">
              <button
                class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                @click="onSignOut"
              >
                Sign out
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>
