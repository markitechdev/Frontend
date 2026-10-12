<script setup>
import { safeRedirect } from '@/utils/permissions';
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const submitting = ref(false);

const errors = reactive({ email: '', password: '' });

// Redirect already authenticated users away from the login view
onMounted(() => {
  if (auth.isAuthenticated) {
    const target = safeRedirect(route.query.redirect, '/dashboard');
    router.replace(target);
  }
});

const validate = () => {
  let valid = true;
  errors.email = '';
  errors.password = '';

  const cleanEmail = email.value.trim();
  if (!cleanEmail) {
    errors.email = 'Email address is required.';
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    errors.email = 'Please enter a valid email address.';
    valid = false;
  }

  if (!password.value) {
    errors.password = 'Password is required.';
    valid = false;
  } else if (password.value.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
    valid = false;
  }

  return valid;
};

const submit = async () => {
  if (!validate()) return;
  if (submitting.value || auth.loading) return;

  submitting.value = true;
  try {
    await auth.login(email.value.trim(), password.value);
    const target = safeRedirect(route.query.redirect, '/dashboard');
    router.replace(target);
  } catch {
    // auth.error is displayed in the alert banner
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-2 bg-slate-50">
    <!-- Brand / SaaS Overview Panel -->
    <div class="hidden lg:flex flex-col justify-between bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 text-white p-12 lg:p-16 relative overflow-hidden">
      <!-- Decorative background glow -->
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div class="relative z-10">
        <div class="flex items-center gap-3">
          <div class="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white grid place-items-center text-sm font-black tracking-wider shadow-lg shadow-blue-500/20">
            IMS
          </div>
          <div>
            <span class="font-bold text-lg tracking-tight block">Inventory Management System</span>
            <span class="text-xs text-blue-300 font-mono tracking-wider uppercase">SaaS Enterprise Platform</span>
          </div>
        </div>
      </div>

      <div class="relative z-10 max-w-lg my-auto py-12">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time Multi-tenant Ledger</span>
        </div>

        <h1 class="text-4xl font-extrabold tracking-tight leading-tight text-white mb-5">
          Precision inventory control with ledger-backed audit safety.
        </h1>
        <p class="text-slate-300 text-base leading-relaxed mb-8">
          Every movement is immutably timestamped against authenticated user credentials. Automated database alert rules trigger proactive reorders before stock levels hit zero.
        </p>

        <div class="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
          <div class="flex items-start gap-3">
            <span class="text-emerald-400 text-lg">✓</span>
            <div>
              <p class="text-sm font-semibold text-white">Role-Based Access</p>
              <p class="text-xs text-slate-400">Granular permissions with isolated tenant scoping</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-emerald-400 text-lg">✓</span>
            <div>
              <p class="text-sm font-semibold text-white">Stock Card Tracking</p>
              <p class="text-xs text-slate-400">Zero-shrinkage FIFO & batch traceability</p>
            </div>
          </div>
        </div>
      </div>

      <div class="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-6">
        <span>Enterprise Release v1.0.0</span>
        <span>Authorized Personnel Only</span>
      </div>
    </div>

    <!-- Login Form Panel -->
    <div class="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
      <div class="w-full max-w-md">
        <!-- Mobile Logo -->
        <div class="lg:hidden flex items-center gap-3 mb-8">
          <div class="h-10 w-10 rounded-xl bg-navy-900 text-white grid place-items-center text-sm font-bold shadow-md">
            IMS
          </div>
          <div>
            <span class="font-bold text-slate-900 block leading-tight">IMS Platform</span>
            <span class="text-xs text-slate-400">Enterprise Inventory</span>
          </div>
        </div>

        <div class="mb-8">
          <h2 class="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
          <p class="text-sm text-slate-500 mt-1.5">
            Enter your authorized system credentials to access your organization workspace.
          </p>
        </div>

        <!-- Session expired / signed out elsewhere -->
        <div
          v-if="route.query.expired === 'true' && !auth.error"
          class="mb-5 flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3"
          role="status"
          aria-live="polite"
        >
          <span class="text-amber-500 font-bold shrink-0" aria-hidden="true">⚠</span>
          <p class="leading-snug">Your session has expired. Please sign in again to continue where you left off.</p>
        </div>

        <form class="space-y-5" @submit.prevent="submit" novalidate>
          <!-- Email Field -->
          <div>
            <label class="label" for="email">
              Work Email <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="username"
                class="input"
                :class="{ 'border-red-400 focus:ring-red-300 focus:border-red-500': errors.email }"
                placeholder="name@organization.com"
                :disabled="submitting || auth.loading"
              />
            </div>
            <p v-if="errors.email" class="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
              <span>⚠</span> {{ errors.email }}
            </p>
          </div>

          <!-- Password Field -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="label mb-0" for="password">
                Password <span class="text-red-500">*</span>
              </label>
            </div>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="input pr-16"
                :class="{ 'border-red-400 focus:ring-red-300 focus:border-red-500': errors.password }"
                placeholder="••••••••••••"
                :disabled="submitting || auth.loading"
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-navy-700 px-1.5 py-0.5 rounded transition-colors"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p v-if="errors.password" class="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
              <span>⚠</span> {{ errors.password }}
            </p>
          </div>

          <!-- Error Alert Banner -->
          <div
            v-if="auth.error"
            class="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3.5"
            role="alert"
          >
            <span class="text-red-500 font-bold shrink-0">✕</span>
            <p class="leading-snug">{{ auth.error }}</p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-primary w-full py-2.5 text-sm font-semibold shadow-sm hover:shadow transition-all"
            :disabled="submitting || auth.loading"
          >
            <svg
              v-if="submitting || auth.loading"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>{{ submitting || auth.loading ? 'Authenticating…' : 'Sign in to Platform' }}</span>
          </button>
        </form>

        <!-- Development Environment Quick-Fill (Only in import.meta.env.DEV) -->

        <div class="mt-8 text-center text-xs text-slate-400">
          <p>Protected by role-based identity checks and session token verification.</p>
        </div>
      </div>
    </div>
  </div>
</template>
