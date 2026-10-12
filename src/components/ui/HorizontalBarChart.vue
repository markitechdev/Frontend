<script setup>
/**
 * Reusable horizontal bar chart (single series).
 *  - one shared scale with "nice" gridline ticks, so bars are comparable
 *  - long labels truncate with the full text in the tooltip
 *  - hover / keyboard-focus tooltip with value, share of total and detail line
 *  - many categories collapse into "Other" (expandable), tiny values stay visible
 *  - built-in loading, empty and error states
 */
import { computed, ref } from 'vue';
import { niceScale, compactNumber } from '@/utils/chartScale';

const props = defineProps({
  /** [{ label: string, value: number, detail?: string }] */
  items: { type: Array, default: () => [] },
  formatValue: { type: Function, default: (v) => Number(v).toLocaleString() },
  /** Short unit name used in the accessible summary, e.g. "stock value". */
  measureLabel: { type: String, default: 'value' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  emptyText: { type: String, default: 'No data to chart yet.' },
  /** Bars shown before the rest fold into "Other". */
  maxBars: { type: Number, default: 8 },
});
const emit = defineEmits(['retry']);

const expanded = ref(false);
const hovered = ref(null);

const clean = computed(() => props.items
  .map((d) => ({ ...d, value: Math.max(0, Number(d.value) || 0) }))
  .sort((a, b) => b.value - a.value));

const total = computed(() => clean.value.reduce((s, d) => s + d.value, 0));

const rows = computed(() => {
  const list = clean.value;
  if (expanded.value || list.length <= props.maxBars) return list;
  const head = list.slice(0, props.maxBars - 1);
  const tail = list.slice(props.maxBars - 1);
  return [...head, {
    label: `Other (${tail.length})`,
    value: tail.reduce((s, d) => s + d.value, 0),
    detail: tail.map((d) => d.label).join(', '),
    isOther: true,
  }];
});

/** Round axis steps (0, 10k, 20k ...) so gridlines land on readable numbers. */
const scale = computed(() => niceScale(Math.max(0, ...rows.value.map((d) => d.value))));
const niceMax = computed(() => scale.value.max);
const ticks = computed(() => scale.value.ticks);

const widthPct = (v) => {
  if (!v) return '0%';
  // keep very small but non-zero values visible as a sliver
  return `${Math.max(0.75, (v / niceMax.value) * 100)}%`;
};
const share = (v) => (total.value ? ((v / total.value) * 100).toFixed(1) : '0.0');

const compact = compactNumber;

const summary = computed(() => rows.value
  .map((d) => `${d.label}: ${props.formatValue(d.value)} (${share(d.value)}%)`)
  .join('; '));
</script>

<template>
  <div class="relative" :aria-busy="loading">
    <!-- loading -->
    <div v-if="loading" class="space-y-3" aria-hidden="true">
      <div v-for="i in 5" :key="i" class="flex items-center gap-3">
        <div class="h-3 w-24 sm:w-32 rounded bg-slate-200 animate-pulse shrink-0" />
        <div class="h-3.5 rounded bg-slate-200 animate-pulse" :style="{ width: `${90 - i * 14}%` }" />
      </div>
    </div>

    <!-- error -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button type="button" class="btn-ghost btn-sm mt-2" @click="emit('retry')">Try again</button>
    </div>

    <!-- empty -->
    <div v-else-if="!rows.length || total === 0" class="text-center py-8">
      <p class="text-sm font-medium text-slate-500">{{ emptyText }}</p>
      <p class="text-xs text-slate-400 mt-1">Change the filters or add stock to see the distribution.</p>
    </div>

    <template v-else>
      <p class="sr-only">Bar chart of {{ measureLabel }}. {{ summary }}</p>

      <div class="relative" role="list">
        <div
          v-for="(d, i) in rows"
          :key="d.label"
          role="listitem"
          tabindex="0"
          class="group relative flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1.5 outline-none rounded focus-visible:ring-2 focus-visible:ring-sky-400"
          @mouseenter="hovered = i"
          @mouseleave="hovered = null"
          @focus="hovered = i"
          @blur="hovered = null"
        >
          <span
            class="sm:w-[8.25rem] sm:shrink-0 sm:text-right text-xs font-medium truncate"
            :class="d.isOther ? 'text-slate-500 italic' : 'text-slate-700'"
            :title="d.label"
            style="min-width: 0; max-width: 100%;"
          >{{ d.label }}</span>

          <div class="relative flex-1 flex items-center gap-2 min-w-0">
            <div class="relative flex-1 h-3.5">
              <!-- gridlines: each row draws its own segment, extended to meet the next row -->
              <div
                v-for="(t, ti) in ticks"
                :key="ti"
                class="hidden sm:block absolute -top-2 -bottom-2 border-l border-dashed border-slate-200 pointer-events-none"
                :style="{ left: `${(t / niceMax) * 100}%` }"
                aria-hidden="true"
              />
              <div
                class="absolute left-0 top-0 h-full rounded-r transition-[width] duration-500 ease-out"
                :class="[d.isOther ? 'bg-slate-400' : 'bg-navy-700', hovered === i ? 'brightness-125' : '']"
                :style="{ width: widthPct(d.value) }"
              />
            </div>
            <span class="w-20 sm:w-24 shrink-0 text-right text-xs tabular-nums font-semibold text-slate-800">
              {{ formatValue(d.value) }}
            </span>
          </div>

          <!-- tooltip (first row opens below so it is never clipped by the card) -->
          <div
            v-if="hovered === i"
            role="tooltip"
            class="absolute z-20 left-0 sm:left-36 rounded-lg bg-slate-900 text-white text-xs px-3 py-2 shadow-lg pointer-events-none max-w-[18rem]"
            :class="i === 0 ? 'top-full mt-1' : 'top-0 -translate-y-full'"
          >
            <p class="font-semibold truncate">{{ d.label }}</p>
            <p class="tabular-nums mt-0.5">{{ formatValue(d.value) }} · {{ share(d.value) }}% of total</p>
            <p v-if="d.detail" class="text-slate-300 mt-0.5 line-clamp-2">{{ d.detail }}</p>
          </div>
        </div>

        <!-- axis -->
        <div class="relative h-5 mt-1 ml-0 sm:ml-36 mr-[5.5rem] sm:mr-[6.5rem] text-[10px] text-slate-400 tabular-nums" aria-hidden="true">
          <span
            v-for="(t, i) in ticks"
            :key="i"
            class="absolute -translate-x-1/2"
            :class="{ 'hidden sm:inline': i % 2 === 1 && ticks.length > 4 }"
            :style="{ left: `${(t / niceMax) * 100}%` }"
          >{{ compact(t) }}</span>
        </div>
      </div>

      <button
        v-if="clean.length > maxBars"
        type="button"
        class="text-xs font-medium text-navy-600 hover:underline mt-1"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Show top categories only' : `Show all ${clean.length} categories` }}
      </button>
    </template>
  </div>
</template>
