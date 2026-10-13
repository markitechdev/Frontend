<script setup>
/**
 * IMS logo: an isometric box (inventory) with rising stock bars (monitoring).
 *  - `animate`  plays the build-up animation once (sides fly in, bars grow)
 *  - `withText` adds the "IMS" wordmark and a subtitle next to the mark
 * The animation is skipped for people who turned on "reduce motion".
 */
defineProps({
  size: { type: Number, default: 36 },
  animate: { type: Boolean, default: false },
  withText: { type: Boolean, default: false },
  subtitle: { type: String, default: 'Inventory Management System' },
  /** 'light' text for dark backgrounds, 'dark' text for light backgrounds */
  tone: { type: String, default: 'light' },
});
</script>

<template>
  <span class="inline-flex items-center gap-3 min-w-0" :class="{ 'ims-logo--animate': animate }">
    <svg
      class="ims-logo shrink-0"
      :width="size"
      :height="size"
      viewBox="0 0 64 64"
      role="img"
      aria-label="IMS logo"
    >
      <polygon class="ims-face ims-left" points="10,18 32,30 32,56 10,44" fill="#0ea5e9" />
      <polygon class="ims-face ims-right" points="54,18 32,30 32,56 54,44" fill="#0369a1" />
      <polygon class="ims-face ims-top" points="32,6 54,18 32,30 10,18" fill="#7dd3fc" />
      <polygon class="ims-bar ims-b1" points="35,51.16 39,48.98 39,40.98 35,43.16" fill="#e0f2fe" />
      <polygon class="ims-bar ims-b2" points="41.5,47.62 45.5,45.44 45.5,32.44 41.5,34.62" fill="#e0f2fe" />
      <polygon class="ims-bar ims-b3" points="48,44.07 52,41.89 52,23.89 48,26.07" fill="#e0f2fe" />
    </svg>
    <span v-if="withText" class="min-w-0 leading-tight">
      <span
        class="ims-word block font-bold tracking-[0.2em]"
        :class="tone === 'light' ? 'text-white' : 'text-slate-900'"
        :style="{ fontSize: `${Math.round(size * 0.42)}px` }"
      >IMS</span>
      <span
        v-if="subtitle"
        class="ims-sub block truncate text-xs"
        :class="tone === 'light' ? 'text-white/60' : 'text-slate-500'"
      >{{ subtitle }}</span>
    </span>
  </span>
</template>

<style scoped>
.ims-logo { overflow: visible; }

.ims-logo--animate .ims-face {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: ims-face-in 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.25) forwards;
}
.ims-logo--animate .ims-left  { --dx: -10px; --dy: 6px;   animation-delay: 0.05s; }
.ims-logo--animate .ims-right { --dx: 10px;  --dy: 6px;   animation-delay: 0.18s; }
.ims-logo--animate .ims-top   { --dx: 0px;   --dy: -12px; animation-delay: 0.31s; }

.ims-logo--animate .ims-bar {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transform: scaleY(0);
  animation: ims-bar-up 0.45s cubic-bezier(0.3, 1.4, 0.5, 1) forwards;
}
.ims-logo--animate .ims-b1 { animation-delay: 0.72s; }
.ims-logo--animate .ims-b2 { animation-delay: 0.84s; }
.ims-logo--animate .ims-b3 { animation-delay: 0.96s; }

.ims-logo--animate .ims-word,
.ims-logo--animate .ims-sub {
  opacity: 0;
  animation: ims-text-in 0.5s ease-out forwards;
}
.ims-logo--animate .ims-word { animation-delay: 0.9s; }
.ims-logo--animate .ims-sub  { animation-delay: 1.05s; }

@keyframes ims-face-in {
  from { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.92); }
  to   { opacity: 1; transform: none; }
}
@keyframes ims-bar-up { to { transform: scaleY(1); } }
@keyframes ims-text-in {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ims-logo--animate .ims-face,
  .ims-logo--animate .ims-bar,
  .ims-logo--animate .ims-word,
  .ims-logo--animate .ims-sub { animation: none; opacity: 1; transform: none; }
}
</style>
