<script setup>
defineProps({
  className: { type: String, default: '' },
  width: { type: String, default: '100%' },
  height: { type: String, default: '1rem' },
  rounded: { type: String, default: 'rounded-md' },
});
</script>

<template>
  <div
    :class="['animate-pulse bg-slate-200/80', rounded, className]"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>
