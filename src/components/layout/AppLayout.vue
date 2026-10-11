<script setup>
import { ref } from 'vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const sidebarOpen = ref(false);
</script>

<template>
  <div class="flex min-h-screen" style="background-color: var(--admin-bg, #F4F7FA);">
    <AppSidebar :mobile-open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="flex-1 min-w-0 flex flex-col min-h-screen">
      <AppTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
