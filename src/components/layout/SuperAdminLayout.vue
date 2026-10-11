<script setup>
import { ref } from 'vue';
import SuperAdminSidebar from './SuperAdminSidebar.vue';
import SuperAdminTopbar from './SuperAdminTopbar.vue';

const sidebarOpen = ref(false);
</script>

<template>
  <div class="flex min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
    <!-- Super Admin Isolated Sidebar Navigation -->
    <SuperAdminSidebar :mobile-open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Main Workspace Container -->
    <div class="flex-1 min-w-0 flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <SuperAdminTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
