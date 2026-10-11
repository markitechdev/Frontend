<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '@/components/layout/AppLayout.vue';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout.vue';
import ToastHost from '@/components/ui/ToastHost.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();

const layoutComponent = computed(() => {
  if (route.meta.layout === 'blank') return 'div';
  if (route.meta.layout === 'super-admin') return SuperAdminLayout;
  return AppLayout;
});

// Pull the latest role/permissions on load so changes apply without a re-login.
onMounted(() => {
  if (auth.isAuthenticated) {
    auth.refreshProfile();
  }
});
</script>

<template>
  <component :is="layoutComponent">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </component>
  <ToastHost />
</template>
