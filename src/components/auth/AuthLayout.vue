<script setup>
import AppLogo from '@/components/brand/AppLogo.vue';
/**
 * Shared, formal two-panel layout for the sign-in pages.
 * Left: organisation panel (desktop only). Right: the form passed in the default slot.
 */
defineProps({
  /** 'staff' (regular users) or 'admin' (system administration) */
  variant: { type: String, default: 'staff' },
  eyebrow: { type: String, default: '' },
  heading: { type: String, required: true },
  description: { type: String, default: '' },
  /** Short, factual capability lines shown on the left panel. */
  points: { type: Array, default: () => [] },
});

const year = new Date().getFullYear();
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-white">
    <!-- organisation panel -->
    <aside
      class="relative hidden lg:flex flex-col justify-between px-14 py-12 text-white overflow-hidden"
      :class="variant === 'admin' ? 'bg-slate-900' : 'bg-navy-900'"
    >
      <!-- subtle grid texture -->
      <div class="absolute inset-0 opacity-[0.06] pointer-events-none auth-grid" aria-hidden="true" />
      <!-- slowly drifting light -->
      <div aria-hidden="true" class="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl float-slow" />
      <div aria-hidden="true" class="pointer-events-none absolute -right-28 bottom-6 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl float-slower" />

      <div class="relative">
        <AppLogo
          :size="48"
          animate
          with-text
          tone="light"
          :subtitle="variant === 'admin' ? 'System Administration' : 'Appliances'"
        />
      </div>

      <div class="relative max-w-md">
        <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-[0.14em] text-white/70 mb-4">{{ eyebrow }}</p>
        <h1 class="text-[2rem] leading-tight font-semibold tracking-tight">{{ heading }}</h1>
        <p v-if="description" class="mt-4 text-[15px] leading-relaxed text-white/70">{{ description }}</p>

        <ul v-if="points.length" class="mt-10 space-y-4 border-t border-white/10 pt-8">
          <li v-for="(p, i) in points" :key="p.title" class="anim-rise group flex gap-3.5" :style="{ '--d': 4 + i * 2 }">
            <span class="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-white/10 ring-1 ring-white/20 grid place-items-center transition-colors duration-300 group-hover:bg-sky-400/30 group-hover:ring-sky-300/50" aria-hidden="true">
              <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="m2.5 6.2 2.3 2.3 4.7-4.9" /></svg>
            </span>
            <div>
              <p class="text-sm font-medium">{{ p.title }}</p>
              <p class="text-[13px] text-white/60 mt-0.5">{{ p.text }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div class="relative flex items-center justify-between text-xs text-white/70">
        <span>&copy; {{ year }} Walang Brownout Appliances</span>
        <span>For authorized personnel only</span>
      </div>
    </aside>

    <!-- form panel -->
    <main class="flex flex-col min-h-screen lg:min-h-0">
      <div class="flex-1 flex items-center justify-center px-6 py-12 sm:px-12">
        <div class="w-full max-w-[400px]">
          <!-- compact brand for phones / tablets -->
          <div class="lg:hidden mb-10">
            <AppLogo
              :size="44"
              animate
              with-text
              tone="dark"
              :subtitle="variant === 'admin' ? 'System Administration' : 'Appliances'"
            />
          </div>

          <slot />
        </div>
      </div>

      <footer class="px-6 sm:px-12 py-5 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>&copy; {{ year }} Walang Brownout Appliances. All rights reserved.</span>
        <slot name="footer" />
      </footer>
    </main>
  </div>
</template>

<style scoped>
.auth-grid {
  background-image:
    linear-gradient(to right, #fff 1px, transparent 1px),
    linear-gradient(to bottom, #fff 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at 30% 40%, #000 30%, transparent 75%);
}
</style>
