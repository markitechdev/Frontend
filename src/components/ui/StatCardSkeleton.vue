<script setup>
import Skeleton from './Skeleton.vue';
</script>

<template>
  <div class="card p-4 flex items-start gap-3 border-slate-200">
    <div class="h-10 w-10 shrink-0 rounded-lg bg-slate-200/80 animate-pulse" />
    <div class="min-w-0 flex-1 space-y-2">
      <Skeleton width="55%" height="0.75rem" />
      <Skeleton width="45%" height="1.5rem" />
      <Skeleton width="75%" height="0.65rem" />
    </div>
  </div>
</template>
