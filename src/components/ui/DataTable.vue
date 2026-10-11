<script setup>
defineProps({
  columns: { type: Array, required: true },   // [{ key, label, align, width }]
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'No records found.' },
  rowKey: { type: String, default: 'id' },
});
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key"
              :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''"
              :style="col.width ? { width: col.width } : null">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody v-if="loading" class="divide-y divide-slate-100">
        <tr v-for="r in 5" :key="`skel-${r}`">
          <td v-for="(col, cIdx) in columns" :key="`skel-${r}-${col.key}`"
              :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''"
              class="py-3.5 px-4">
            <div class="inline-block animate-pulse bg-slate-200/80 rounded h-3.5"
                 :style="{ width: cIdx === 0 ? '75%' : (cIdx === columns.length - 1 ? '45%' : '60%') }" />
          </td>
        </tr>
      </tbody>
      <tbody v-else-if="!rows.length">
        <tr>
          <td :colspan="columns.length" class="text-center py-12 text-slate-400">
            <div class="max-w-xs mx-auto space-y-2">
              <div class="h-10 w-10 rounded-full bg-slate-100 mx-auto grid place-items-center text-slate-400 text-lg">∅</div>
              <p class="text-sm font-medium text-slate-600">{{ emptyMessage }}</p>
            </div>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr v-for="(row, i) in rows" :key="row[rowKey] ?? i">
          <td v-for="col in columns" :key="col.key"
              :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="i">
              {{ row[col.key] ?? '—' }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
