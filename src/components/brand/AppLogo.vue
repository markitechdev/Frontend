<script setup>
/**
 * Walang Brownout Appliances logo: a power ring with a lightning bolt striking
 * through its gap ("the power stays on").
 *  - `animate`  plays the build-up once (badge pops in, ring swings in, bolt strikes)
 *  - `withText` adds the wordmark and a subtitle next to the mark
 * The animation is skipped for people who turned on "reduce motion".
 */
defineProps({
  size: { type: Number, default: 36 },
  animate: { type: Boolean, default: false },
  withText: { type: Boolean, default: false },
  subtitle: { type: String, default: 'Appliances' },
  /** 'light' text for dark backgrounds, 'dark' text for light backgrounds */
  tone: { type: String, default: 'light' },
});
</script>

<template>
  <span class="inline-flex items-center gap-3 min-w-0" :class="{ 'wb-logo--animate': animate }">
    <!-- one layer per shape, so the animation runs on the GPU -->
    <span class="wb-logo relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }" role="img" aria-label="Walang Brownout Appliances logo">
      <svg class="wb-badge" viewBox="0 0 64 64" aria-hidden="true"><rect x="4" y="4" width="56" height="56" rx="15" fill="#1d4ed8" /></svg>
      <svg class="wb-ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="33" r="19" fill="none" stroke="#bfdbfe" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="94 25.4" transform="rotate(-63 32 33)" /></svg>
      <svg class="wb-bolt" viewBox="0 0 64 64" aria-hidden="true">
        <polygon points="35.5,8 20,35 30,35 27.5,57 44,28 34.5,28" fill="#fbbf24" />
        <polygon points="35.5,8 20,35 30,35 29,42 44,28 34.5,28" fill="#fcd34d" />
      </svg>
    </span>
    <span v-if="withText" class="min-w-0 leading-tight">
      <span
        class="wb-word block font-extrabold tracking-[0.08em] whitespace-nowrap"
        :class="tone === 'light' ? 'text-white' : 'text-slate-900'"
        :style="{ fontSize: `${Math.round(size * 0.31)}px` }"
      >WALANG BROWNOUT</span>
      <span
        v-if="subtitle"
        class="wb-sub block truncate text-xs"
        :class="tone === 'light' ? 'text-white/60' : 'text-slate-500'"
      >{{ subtitle }}</span>
    </span>
  </span>
</template>

<style scoped>
.wb-logo svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }

.wb-logo--animate .wb-badge { opacity: 0; animation: wb-badge-in 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.25) forwards; }
.wb-logo--animate .wb-ring  { opacity: 0; transform-origin: 50% 51.5%; animation: wb-ring-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.25s forwards; }
.wb-logo--animate .wb-bolt  { opacity: 0; transform-origin: 55% 12%; animation: wb-bolt-in 0.45s cubic-bezier(0.3, 1.4, 0.5, 1) 0.6s forwards; }

.wb-logo--animate .wb-word,
.wb-logo--animate .wb-sub { opacity: 0; animation: wb-text-in 0.5s ease-out forwards; }
.wb-logo--animate .wb-word { animation-delay: 0.8s; }
.wb-logo--animate .wb-sub  { animation-delay: 0.95s; }

@keyframes wb-badge-in { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: none; } }
@keyframes wb-ring-in  { from { opacity: 0; transform: rotate(-120deg) scale(0.8); } to { opacity: 1; transform: none; } }
@keyframes wb-bolt-in  { from { opacity: 0; transform: translateY(-18%) scaleY(0.4); } 60% { opacity: 1; transform: translateY(2%) scaleY(1.06); } to { opacity: 1; transform: none; } }
@keyframes wb-text-in  { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .wb-logo--animate .wb-badge,
  .wb-logo--animate .wb-ring,
  .wb-logo--animate .wb-bolt,
  .wb-logo--animate .wb-word,
  .wb-logo--animate .wb-sub { animation: none; opacity: 1; transform: none; }
}
</style>
