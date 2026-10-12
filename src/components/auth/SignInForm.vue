<script setup>
/** Email + password form shared by the staff and administrator sign-in pages. */
import { ref, reactive } from 'vue';

const props = defineProps({
  idPrefix: { type: String, default: 'signin' },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
  notice: { type: String, default: '' },
  submitLabel: { type: String, default: 'Sign in' },
});
const emit = defineEmits(['submit']);

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errors = reactive({ email: '', password: '' });

const validate = () => {
  errors.email = '';
  errors.password = '';
  const value = email.value.trim();
  if (!value) errors.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Enter a valid email address.';
  if (!password.value) errors.password = 'Enter your password.';
  return !errors.email && !errors.password;
};

const submit = () => {
  if (props.busy || !validate()) return;
  emit('submit', { email: email.value.trim(), password: password.value });
};

const id = (name) => `${props.idPrefix}-${name}`;
</script>

<template>
  <div>
    <div
      v-if="notice && !error"
      class="mb-6 flex gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900"
      role="status"
      aria-live="polite"
    >
      <svg class="h-4 w-4 mt-0.5 shrink-0 text-amber-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.5a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0v-4ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>
      <p>{{ notice }}</p>
    </div>

    <div
      v-if="error"
      class="mb-6 flex gap-2.5 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
      role="alert"
      aria-live="assertive"
    >
      <svg class="h-4 w-4 mt-0.5 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd" /></svg>
      <p>{{ error }}</p>
    </div>

    <form class="space-y-5" novalidate @submit.prevent="submit">
      <div>
        <label :for="id('email')" class="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
        <input
          :id="id('email')"
          v-model="email"
          type="email"
          autocomplete="username"
          inputmode="email"
          class="auth-input"
          :class="{ 'auth-input-error': errors.email }"
          :disabled="busy"
          :aria-invalid="Boolean(errors.email)"
          :aria-describedby="errors.email ? id('email-error') : undefined"
        />
        <p v-if="errors.email" :id="id('email-error')" class="mt-1.5 text-xs text-red-600">{{ errors.email }}</p>
      </div>

      <div>
        <label :for="id('password')" class="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
        <div class="relative">
          <input
            :id="id('password')"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class="auth-input pr-11"
            :class="{ 'auth-input-error': errors.password }"
            :disabled="busy"
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="errors.password ? id('password-error') : undefined"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 px-3 grid place-items-center text-slate-400 hover:text-slate-600 rounded-r-md focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <svg v-if="!showPassword" class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
            <svg v-else class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
          </button>
        </div>
        <p v-if="errors.password" :id="id('password-error')" class="mt-1.5 text-xs text-red-600">{{ errors.password }}</p>
      </div>

      <button
        type="submit"
        class="w-full inline-flex items-center justify-center gap-2 rounded-md bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        :disabled="busy"
        :aria-busy="busy"
      >
        <svg v-if="busy" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z" />
        </svg>
        {{ busy ? 'Signing in…' : submitLabel }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.auth-input {
  @apply block w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm
         placeholder:text-slate-400 transition-colors
         focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20
         disabled:bg-slate-50 disabled:text-slate-500;
}
.auth-input-error {
  @apply border-red-400 focus:border-red-500 focus:ring-red-500/20;
}
</style>
