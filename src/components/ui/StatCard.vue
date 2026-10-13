<script setup>
import { computed } from 'vue';
import AnimatedNumber from './AnimatedNumber.vue';

const props = defineProps({
  label: { type: String, default: '' },
  title: { type: String, default: '' }, // alias for label
  value: { type: [String, Number], default: null },
  sublabel: { type: String, default: '' },
  subtitle: { type: String, default: '' }, // alias for sublabel
  tone: { type: String, default: 'default' }, // default | amber | red | green | blue | warning | danger
  accent: { type: String, default: '' }, // alias for tone
  icon: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  /** Position in a row of cards; staggers the entrance animation. */
  index: { type: Number, default: 0 },
});

const tones = {
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  amber:   'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  red:     'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  danger:  'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  green:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  blue:    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
};

const displayLabel = computed(() => props.label || props.title || '');
const displaySublabel = computed(() => props.sublabel || props.subtitle || '');
const displayTone = computed(() => {
  const t = props.accent || props.tone || 'default';
  return tones[t] || tones.default;
});

/** "₱1,234.50" / "1,234" -> parts for a counting animation (other values show as-is). */
const countable = computed(() => {
  const m = /^(₱?)(-?[\d,]+)(?:\.(\d+))?$/.exec(String(displayValue.value).trim());
  if (!m) return null;
  const decimals = m[3] ? m[3].length : 0;
  const number = Number(`${m[2].replace(/,/g, '')}${m[3] ? `.${m[3]}` : ''}`);
  if (!Number.isFinite(number)) return null;
  const prefix = m[1];
  return {
    number,
    format: (n) => prefix + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
  };
});

const displayValue = computed(() => {
  if (props.loading) return '--';
  if (props.value === null || props.value === undefined || props.value === '') return '--';
  return props.value;
});
</script>

<template>
  <div class="group card lift anim-rise p-4 flex items-start gap-3" :style="{ '--d': index }">
    <div :class="['h-10 w-10 shrink-0 rounded-lg grid place-items-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6', displayTone]">
      <slot name="icon">
        <span v-if="icon" class="text-base">{{ icon }}</span>
        <span v-else class="text-base font-bold">{{ String(displayLabel).charAt(0) }}</span>
      </slot>
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 truncate">{{ displayLabel }}</p>
      <div v-if="loading" class="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse my-0.5" />
      <p v-else class="text-2xl font-bold text-slate-900 dark:text-white leading-tight tabular-nums">
        <AnimatedNumber v-if="countable" :value="countable.number" :format="countable.format" />
        <template v-else>{{ displayValue }}</template>
      </p>
      <p v-if="displaySublabel" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{{ displaySublabel }}</p>
    </div>
  </div>
</template>
