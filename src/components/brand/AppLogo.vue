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
    <!-- one layer per shape, so the animation runs on the GPU -->
    <span class="ims-logo relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }" role="img" aria-label="IMS logo">
      <svg class="ims-face ims-left" viewBox="0 0 64 64" aria-hidden="true"><polygon points="10,18 32,30 32,56 10,44" fill="#0ea5e9" /></svg>
      <svg class="ims-face ims-right" viewBox="0 0 64 64" aria-hidden="true"><polygon points="54,18 32,30 32,56 54,44" fill="#0369a1" /></svg>
      <svg class="ims-face ims-top" viewBox="0 0 64 64" aria-hidden="true"><polygon points="32,6 54,18 32,30 10,18" fill="#7dd3fc" /></svg>
      <svg class="ims-bar ims-b1" viewBox="0 0 64 64" aria-hidden="true"><polygon points="35,51.16 39,48.98 39,40.98 35,43.16" fill="#e0f2fe" /></svg>
      <svg class="ims-bar ims-b2" viewBox="0 0 64 64" aria-hidden="true"><polygon points="41.5,47.62 45.5,45.44 45.5,32.44 41.5,34.62" fill="#e0f2fe" /></svg>
      <svg class="ims-bar ims-b3" viewBox="0 0 64 64" aria-hidden="true"><polygon points="48,44.07 52,41.89 52,23.89 48,26.07" fill="#e0f2fe" /></svg>
    </span>
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
.ims-logo svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }

/* offsets are a share of the logo size, so every size moves the same way */
.ims-logo--animate .ims-face {
  opacity: 0;
  animation: ims-face-in 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.25) forwards;
}
.ims-logo--animate .ims-left  { --dx: -16%; --dy: 9%;   transform-origin: 33% 58%; animation-delay: 0.05s; }
.ims-logo--animate .ims-right { --dx: 16%;  --dy: 9%;   transform-origin: 67% 58%; animation-delay: 0.18s; }
.ims-logo--animate .ims-top   { --dx: 0%;   --dy: -19%; transform-origin: 50% 28%; animation-delay: 0.31s; }

/* bars grow from their bottom edge (origin = the bar's bottom in the 64x64 drawing) */
.ims-logo--animate .ims-bar {
  transform: scaleY(0);
  animation: ims-bar-up 0.45s cubic-bezier(0.3, 1.4, 0.5, 1) forwards;
}
.ims-logo--animate .ims-b1 { transform-origin: 57.8% 79.9%; animation-delay: 0.72s; }
.ims-logo--animate .ims-b2 { transform-origin: 68% 74.4%;   animation-delay: 0.84s; }
.ims-logo--animate .ims-b3 { transform-origin: 78.1% 68.9%; animation-delay: 0.96s; }

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
