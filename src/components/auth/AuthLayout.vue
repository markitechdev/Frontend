<script setup>
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

      <div class="relative flex items-center gap-3">
        <div class="h-10 w-10 rounded-lg bg-white/10 ring-1 ring-white/20 grid place-items-center" aria-hidden="true">
          <svg class="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" />
          </svg>
        </div>
        <div class="leading-tight">
          <p class="text-[15px] font-semibold tracking-tight">Inventory Management System</p>
          <p class="text-xs text-white/60">{{ variant === 'admin' ? 'System Administration' : 'Stock Monitoring and Control' }}</p>
        </div>
      </div>

      <div class="relative max-w-md">
        <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-[0.14em] text-white/50 mb-4">{{ eyebrow }}</p>
        <h1 class="text-[2rem] leading-tight font-semibold tracking-tight">{{ heading }}</h1>
        <p v-if="description" class="mt-4 text-[15px] leading-relaxed text-white/70">{{ description }}</p>

        <ul v-if="points.length" class="mt-10 space-y-4 border-t border-white/10 pt-8">
          <li v-for="p in points" :key="p.title" class="flex gap-3.5">
            <span class="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-white/10 ring-1 ring-white/20 grid place-items-center" aria-hidden="true">
              <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="m2.5 6.2 2.3 2.3 4.7-4.9" /></svg>
            </span>
            <div>
              <p class="text-sm font-medium">{{ p.title }}</p>
              <p class="text-[13px] text-white/60 mt-0.5">{{ p.text }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div class="relative flex items-center justify-between text-xs text-white/50">
        <span>&copy; {{ year }} Inventory Management System</span>
        <span>For authorized personnel only</span>
      </div>
    </aside>

    <!-- form panel -->
    <main class="flex flex-col min-h-screen lg:min-h-0">
      <div class="flex-1 flex items-center justify-center px-6 py-12 sm:px-12">
        <div class="w-full max-w-[400px]">
          <!-- compact brand for phones / tablets -->
          <div class="lg:hidden flex items-center gap-3 mb-10">
            <div class="h-10 w-10 rounded-lg grid place-items-center text-white"
                 :class="variant === 'admin' ? 'bg-slate-900' : 'bg-navy-900'" aria-hidden="true">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" />
              </svg>
            </div>
            <div class="leading-tight">
              <p class="text-[15px] font-semibold text-slate-900">Inventory Management System</p>
              <p class="text-xs text-slate-500">{{ variant === 'admin' ? 'System Administration' : 'Stock Monitoring and Control' }}</p>
            </div>
          </div>

          <slot />
        </div>
      </div>

      <footer class="px-6 sm:px-12 py-5 border-t border-slate-100 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>&copy; {{ year }} Inventory Management System. All rights reserved.</span>
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
