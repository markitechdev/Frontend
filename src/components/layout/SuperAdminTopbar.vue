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

const title = computed(() => route.meta?.title || 'Dashboard');

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

const onSignOut = async () => {
  menuOpen.value = false;
  await auth.superAdminLogout();
  router.replace({ name: 'super-admin-login' });
};

const onClickOutside = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    menuOpen.value = false;
  }
};

const onKeyDown = (e) => {
  if (e.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false;
  }
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
  <header
    class="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 shadow-sm"
  >
    <!-- Left: Mobile menu button & breadcrumbs -->
    <div class="flex items-center gap-2 sm:gap-3 min-w-0">
      <button
        type="button"
        class="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
        @click="emit('toggle-sidebar')"
        aria-label="Toggle navigation drawer"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div class="flex items-center gap-2 truncate">
        <span class="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800/60">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          Administration
        </span>
        <span class="hidden sm:inline text-slate-300 dark:text-slate-600">/</span>
        <h1 class="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 dark:text-white truncate">
          {{ title }}
        </h1>
      </div>
    </div>

    <!-- Right: user profile dropdown -->
    <div class="flex items-center gap-2 sm:gap-3">
      <!-- Session clearance badge -->

      <!-- Super Admin Profile Dropdown -->
      <div class="relative" ref="menuRef">
        <button
          type="button"
          class="flex items-center gap-2 sm:gap-2.5 p-1.5 min-h-[44px] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
          @click="menuOpen = !menuOpen"
          :aria-expanded="menuOpen"
          aria-haspopup="true"
        >
          <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {{ initials }}
          </div>
          <div class="hidden sm:flex flex-col text-left">
            <span class="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {{ auth.user?.fullName || auth.user?.name || 'Super Admin' }}
            </span>
            <span class="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Super Admin
            </span>
          </div>
          <svg
            :class="['w-4 h-4 text-slate-400 transition-transform duration-150', menuOpen ? 'rotate-180' : '']"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="menuOpen"
          class="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
          role="menu"
        >
          <div class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <p class="font-semibold text-slate-900 dark:text-slate-100">
              {{ auth.user?.fullName || auth.user?.name || 'Super Admin' }}
            </p>
            <p class="text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {{ auth.user?.email || 'admin@platform.local' }}
            </p>
            <div class="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              SUPER ADMIN
            </div>
          </div>

          <div class="px-2 py-1.5">
            <button
              type="button"
              class="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 font-medium transition text-left"
              @click="onSignOut"
              role="menuitem"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
