<script setup>
/**
 * Vertical (column) bar chart, single series.
 *  - round y-axis steps (0, 10k, 20k ...) with light gridlines
 *  - short value on top of each column, full value under the label
 *  - hover / keyboard-focus tooltip with value, share of total and detail line
 *  - many categories collapse into "Other" (expandable); scrolls sideways on phones
 *  - built-in loading, empty and error states
 */
import { computed, ref } from 'vue';
import { niceScale, compactNumber } from '@/utils/chartScale';

const props = defineProps({
  /** [{ label: string, value: number, detail?: string }] */
  items: { type: Array, default: () => [] },
  formatValue: { type: Function, default: (v) => Number(v).toLocaleString() },
  /** Short form shown on top of the columns and on the y-axis. */
  compactValue: { type: Function, default: compactNumber },
  /** Short unit name used in the accessible summary, e.g. "stock value". */
  measureLabel: { type: String, default: 'value' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  emptyText: { type: String, default: 'No data to chart yet.' },
  /** Columns shown before the rest fold into "Other". */
  maxBars: { type: Number, default: 8 },
  /** Plot height in px. */
  height: { type: Number, default: 260 },
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

const scale = computed(() => niceScale(Math.max(0, ...rows.value.map((d) => d.value))));

/** Column height as a % of the plot; tiny non-zero values stay visible. */
const pct = (v) => (v > 0 ? Math.max(1, (v / scale.value.max) * 100) : 0);
const share = (v) => (total.value ? ((v / total.value) * 100).toFixed(1) : '0.0');

/** Phones scroll sideways instead of squeezing columns below ~60px. */
const minWidth = computed(() => `${rows.value.length * 60 + 48}px`);

const tooltipStyle = (d, i) => {
  const p = pct(d.value);
  const style = p > 55
    ? { top: `calc(${100 - p}% + 8px)` }          // tall column: show inside its top
    : { bottom: `calc(${p}% + 26px)` };           // short column: show above its label
  if (i === 0) style.left = '0';
  else if (i === rows.value.length - 1) style.right = '0';
  else { style.left = '50%'; style.transform = 'translateX(-50%)'; }
  return style;
};

const summary = computed(() => rows.value
  .map((d) => `${d.label}: ${props.formatValue(d.value)} (${share(d.value)}%)`)
  .join('; '));
</script>

<template>
  <div class="relative" :aria-busy="loading">
    <!-- loading -->
    <div v-if="loading" class="flex items-end gap-4 pl-12 pt-6" :style="{ height: `${height + 24}px` }" aria-hidden="true">
      <div v-for="i in 5" :key="i" class="flex-1 flex justify-center">
        <div class="w-3/5 max-w-[64px] rounded-t-md bg-slate-200 dark:bg-slate-800 animate-pulse"
             :style="{ height: `${(height * (100 - i * 15)) / 100}px` }" />
      </div>
    </div>

    <!-- error -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button type="button" class="btn-ghost btn-sm mt-2" @click="emit('retry')">Try again</button>
    </div>

    <!-- empty -->
    <div v-else-if="!rows.length || total === 0" class="text-center py-8">
      <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ emptyText }}</p>
      <p class="text-xs text-slate-400 mt-1">Change the filters or add stock to see the distribution.</p>
    </div>

    <template v-else>
      <p class="sr-only">Column chart of {{ measureLabel }}. {{ summary }}</p>

      <div class="overflow-x-auto">
        <div class="pt-6" :style="{ minWidth }">
          <div class="flex">
            <!-- y-axis -->
            <div class="relative w-12 shrink-0" :style="{ height: `${height}px` }" aria-hidden="true">
              <span
                v-for="t in scale.ticks"
                :key="t"
                class="absolute right-2 translate-y-1/2 text-[10px] leading-none text-slate-400 tabular-nums"
                :style="{ bottom: `${(t / scale.max) * 100}%` }"
              >{{ compactValue(t) }}</span>
            </div>

            <!-- plot -->
            <div class="relative flex-1" :style="{ height: `${height}px` }">
              <div
                v-for="t in scale.ticks"
                :key="t"
                class="absolute inset-x-0 border-t pointer-events-none"
                :class="t === 0 ? 'border-slate-300 dark:border-slate-600' : 'border-dashed border-slate-200 dark:border-slate-700/70'"
                :style="{ bottom: `${(t / scale.max) * 100}%` }"
                aria-hidden="true"
              />

              <div class="absolute inset-0 flex" role="list">
                <div
                  v-for="(d, i) in rows"
                  :key="d.label"
                  role="listitem"
                  tabindex="0"
                  :aria-label="`${d.label}: ${formatValue(d.value)}, ${share(d.value)}% of total`"
                  class="relative flex-1 h-full outline-none rounded focus-visible:ring-2 focus-visible:ring-sky-400"
                  @mouseenter="hovered = i"
                  @mouseleave="hovered = null"
                  @focus="hovered = i"
                  @blur="hovered = null"
                >
                  <!-- value on top -->
                  <span
                    class="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-200 transition-[bottom] duration-500 ease-out"
                    :style="{ bottom: `calc(${pct(d.value)}% + 6px)` }"
                    aria-hidden="true"
                  >{{ compactValue(d.value) }}</span>

                  <!-- column -->
                  <div
                    class="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 max-w-[72px] rounded-t-md transition-[height,opacity] duration-500 ease-out"
                    :class="[
                      d.isOther ? 'bg-slate-400 dark:bg-slate-500' : 'bg-navy-700 dark:bg-sky-500',
                      hovered !== null && hovered !== i ? 'opacity-50' : 'opacity-100',
                    ]"
                    :style="{ height: `${pct(d.value)}%` }"
                    aria-hidden="true"
                  />

                  <!-- tooltip -->
                  <div
                    v-if="hovered === i"
                    role="tooltip"
                    class="absolute z-20 w-max max-w-[14rem] rounded-lg bg-slate-900 text-white text-xs px-3 py-2 shadow-lg ring-1 ring-white/10 pointer-events-none"
                    :style="tooltipStyle(d, i)"
                  >
                    <p class="font-semibold truncate">{{ d.label }}</p>
                    <p class="tabular-nums mt-0.5">{{ formatValue(d.value) }} · {{ share(d.value) }}% of total</p>
                    <p v-if="d.detail" class="text-slate-300 mt-0.5 line-clamp-2">{{ d.detail }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- x-axis labels -->
          <div class="flex pl-12 mt-2" aria-hidden="true">
            <div v-for="d in rows" :key="d.label" class="flex-1 min-w-0 px-1 text-center">
              <p class="text-xs font-medium truncate"
                 :class="d.isOther ? 'text-slate-500 italic' : 'text-slate-700 dark:text-slate-200'"
                 :title="d.label">{{ d.label }}</p>
              <p class="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">{{ formatValue(d.value) }}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="clean.length > maxBars"
        type="button"
        class="text-xs font-medium text-navy-600 dark:text-sky-400 hover:underline mt-2"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Show top categories only' : `Show all ${clean.length} categories` }}
      </button>
    </template>
  </div>
</template>
