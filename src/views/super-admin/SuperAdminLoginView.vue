<script setup>
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

// Dev environment demo account for Super Admin testing
const isDev = Boolean(import.meta.env.DEV);
const SUPER_ADMIN_DEMO = {
  role: 'Platform Super Admin',
  email: 'superadmin@ims.local',
  password: 'SuperAdmin123!',
};

const useSuperAdminDemo = () => {
  email.value = SUPER_ADMIN_DEMO.email;
  password.value = SUPER_ADMIN_DEMO.password;
  errors.email = '';
  errors.password = '';
};

onMounted(() => {
  if (auth.isAuthenticated && auth.isSuperAdmin) {
    const target = typeof route.query.redirect === 'string' ? route.query.redirect : '/super-admin/dashboard';
    router.replace(target);
  }
});

const validate = () => {
  let valid = true;
  errors.email = '';
  errors.password = '';

  const cleanEmail = email.value.trim();
  if (!cleanEmail) {
    errors.email = 'Super Admin email is required.';
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    errors.email = 'Please provide a valid email format.';
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
  if (submitting.value) return;
  if (!validate()) return;

  submitting.value = true;
  auth.error = null;
  try {
    if (typeof auth.superAdminLogin === 'function') {
      await auth.superAdminLogin(email.value.trim(), password.value);
    } else {
      await auth.login(email.value.trim(), password.value);
    }
    const target = typeof route.query.redirect === 'string' ? route.query.redirect : '/super-admin/dashboard';
    router.replace(target);
  } catch (err) {
    // Error is set in auth store with safe generic message
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-2 bg-slate-950">
    <!-- Brand / Security Notice Panel -->
    <div class="relative hidden lg:flex flex-col justify-between p-12 bg-[#0A101D] border-r border-slate-800/80 text-white overflow-hidden">
      <!-- Ambient Gradient Accents -->
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div class="relative z-10">
        <div class="flex items-center gap-3">
          <div class="h-11 w-11 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white grid place-items-center text-sm font-black tracking-wider shadow-lg shadow-purple-500/25">
            IMS
          </div>
          <div>
            <span class="font-bold text-lg tracking-tight block">Platform Control Console</span>
            <span class="text-xs text-purple-300 font-mono tracking-wider uppercase">Super Admin Tier</span>
          </div>
        </div>
      </div>

      <div class="relative z-10 max-w-lg my-auto py-12">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span>Restricted Platform Operations</span>
        </div>

        <h1 class="text-4xl font-extrabold tracking-tight leading-tight text-white mb-5">
          Root governance across all tenants, roles, and ledger systems.
        </h1>
        <p class="text-slate-300 text-base leading-relaxed mb-8">
          This portal is reserved exclusively for platform-level Super Administrators. All authentication attempts and privileged administrative mutations are immutably logged to the global audit trail.
        </p>

        <div class="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
          <div class="flex items-start gap-3">
            <span class="text-purple-400 text-lg">🛡</span>
            <div>
              <p class="text-sm font-semibold text-white">Full Tenant Isolation</p>
              <p class="text-xs text-slate-400">Strict cross-tenant boundaries & workspace policy enforcement</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-purple-400 text-lg">⚡</span>
            <div>
              <p class="text-sm font-semibold text-white">Cryptographic Claims</p>
              <p class="text-xs text-slate-400">Database-verified RBAC with zero client-side role trust</p>
            </div>
          </div>
        </div>
      </div>

      <div class="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-6">
        <span>Security Level: Tier-0 Super Admin</span>
        <span>Dedicated Auth Flow</span>
      </div>
    </div>

    <!-- Super Admin Login Form Panel -->
    <div class="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
      <div class="w-full max-w-md">
        <!-- Header badge -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2.5">
            <div class="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center text-xs font-black shadow-sm">
              IMS
            </div>
            <span class="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
              Super Admin Console
            </span>
          </div>

          <RouterLink to="/login" class="text-xs font-medium text-slate-500 hover:text-navy-700 transition-colors">
            ← Normal Login
          </RouterLink>
        </div>

        <div class="mb-8">
          <h2 class="text-2xl font-bold tracking-tight text-slate-900">Platform Administrator Sign In</h2>
          <p class="text-sm text-slate-500 mt-1.5">
            Authenticate with your verified Super Admin credentials to enter the platform administration dashboard.
          </p>
        </div>

        <!-- Session Expired Notice -->
        <div
          v-if="route.query.expired === 'true' && !auth.error"
          class="mb-5 flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3"
          role="status"
        >
          <span class="text-amber-500 font-bold shrink-0">⚠</span>
          <p class="leading-snug">Your Super Admin session has expired. Please sign in again to continue.</p>
        </div>

        <form class="space-y-5" @submit.prevent="submit" novalidate>
          <!-- Email Field -->
          <div>
            <label class="label" for="sa-email">
              Admin Email <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                id="sa-email"
                v-model="email"
                type="email"
                required
                autocomplete="username"
                class="input"
                :class="{ 'border-red-400 focus:ring-red-300 focus:border-red-500': errors.email }"
                placeholder="superadmin@ims.local"
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
              <label class="label mb-0" for="sa-password">
                Admin Password <span class="text-red-500">*</span>
              </label>
            </div>
            <div class="relative">
              <input
                id="sa-password"
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
            class="btn-primary w-full py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 shadow-sm transition-all"
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
            <span>{{ submitting || auth.loading ? 'Verifying Super Admin Claims…' : 'Access Super Admin Console' }}</span>
          </button>
        </form>

        <!-- Development Quick-Fill -->
        <div v-if="isDev" class="mt-8 pt-6 border-t border-slate-200">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Dev Super Admin Credentials
            </p>
            <span class="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono font-medium">SUPER ADMIN ONLY</span>
          </div>
          <button
            type="button"
            class="w-full text-left rounded-lg border border-purple-200 bg-purple-50/50 p-2.5 hover:border-purple-400 hover:bg-purple-50 transition-colors"
            @click="useSuperAdminDemo"
          >
            <p class="text-xs font-semibold text-purple-900">{{ SUPER_ADMIN_DEMO.role }}</p>
            <p class="text-[11px] text-purple-600 font-mono">{{ SUPER_ADMIN_DEMO.email }}</p>
          </button>
        </div>

        <div class="mt-8 text-center text-xs text-slate-400">
          Restricted platform area. Unauthorized access attempts are monitored and recorded.
        </div>
      </div>
    </div>
  </div>
</template>
