<script setup>
import { computed, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
// Loaded on demand, so the sign-in pages don't download the app shells.
const AppLayout = defineAsyncComponent(() => import('@/components/layout/AppLayout.vue'));
const SuperAdminLayout = defineAsyncComponent(() => import('@/components/layout/SuperAdminLayout.vue'));
import ToastHost from '@/components/ui/ToastHost.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();

const layoutComponent = computed(() => {
  // Before the first navigation resolves, render nothing around the page (no sidebar flash on /login).
  if (!route.matched.length) return 'div';
  if (route.meta.layout === 'blank') return 'div';
  // 404 / Access Denied: full shell when signed in, plain page when signed out.
  if (route.meta.layout === 'auto') {
    if (!auth.isAuthenticated) return 'div';
    return auth.context === 'super_admin' ? SuperAdminLayout : AppLayout;
  }
  if (route.meta.layout === 'super-admin') return SuperAdminLayout;
  return AppLayout;
});
// Profile/permission verification happens once in the router guard (auth.ensureVerified).
</script>

<template>
  <component :is="layoutComponent">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </component>
  <ToastHost />
</template>
