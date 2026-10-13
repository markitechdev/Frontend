<script setup>
/**
 * Counts a number up to its value (and between values when it changes).
 * Uses one requestAnimationFrame loop for ~0.7 s. Shows the final value at
 * once on phone-sized screens (saves main-thread time on slower devices), for
 * people who prefer reduced motion, and when the value isn't a number.
 */
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  value: { type: [Number, String], default: null },
  format: { type: Function, default: (n) => Math.round(n).toLocaleString() },
  duration: { type: Number, default: 700 },
  /** Shown while there is no value. */
  placeholder: { type: String, default: '--' },
});

const shown = ref(null);
let frame = 0;
const canAnimate = typeof window !== 'undefined'
  && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  && window.matchMedia?.('(min-width: 768px)').matches;

const isNum = (v) => v !== null && v !== '' && v !== undefined && Number.isFinite(Number(v));

const run = (to, from) => {
  cancelAnimationFrame(frame);
  if (!isNum(to) || !canAnimate) { shown.value = to; return; }
  const target = Number(to);
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / props.duration);
    const eased = 1 - (1 - t) ** 3;
    shown.value = from + (target - from) * eased;
    if (t < 1) frame = requestAnimationFrame(step);
    else shown.value = target;
  };
  frame = requestAnimationFrame(step);
};

onMounted(() => run(props.value, 0));
watch(() => props.value, (v, old) => run(v, isNum(old) ? Number(old) : 0));
onBeforeUnmount(() => cancelAnimationFrame(frame));

const text = () => {
  const v = shown.value;
  if (v === null || v === undefined || v === '') return props.placeholder;
  return isNum(v) ? props.format(Number(v)) : String(v);
};
</script>

<template>
  <span class="tabular-nums">{{ text() }}</span>
</template>
