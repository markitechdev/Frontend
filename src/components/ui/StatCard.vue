<script setup>
import { computed } from 'vue';

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

const displayValue = computed(() => {
  if (props.loading) return '--';
  if (props.value === null || props.value === undefined || props.value === '') return '--';
  return props.value;
});
</script>

<template>
  <div class="card p-4 flex items-start gap-3">
    <div :class="['h-10 w-10 shrink-0 rounded-lg grid place-items-center', displayTone]">
      <slot name="icon">
        <span v-if="icon" class="text-base">{{ icon }}</span>
        <span v-else class="text-base font-bold">{{ String(displayLabel).charAt(0) }}</span>
      </slot>
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{{ displayLabel }}</p>
      <div v-if="loading" class="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse my-0.5" />
      <p v-else class="text-2xl font-bold text-slate-900 dark:text-white leading-tight tabular-nums">{{ displayValue }}</p>
      <p v-if="displaySublabel" class="text-xs text-slate-400 mt-0.5 truncate">{{ displaySublabel }}</p>
    </div>
  </div>
</template>
