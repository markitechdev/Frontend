<script setup>
defineProps({
  columns: { type: Number, default: 5 },
  rows: { type: Number, default: 5 },
});
</script>

<template>
  <tbody class="divide-y divide-slate-100">
    <tr v-for="r in rows" :key="`skel-r-${r}`" class="hover:bg-transparent">
      <td v-for="c in columns" :key="`skel-c-${c}`" class="py-3.5 px-4">
        <div
          class="h-3.5 bg-slate-200/80 rounded animate-pulse"
          :style="{ width: c === 1 ? '75%' : (c === columns ? '40%' : '55%') }"
        />
      </td>
    </tr>
  </tbody>
</template>
