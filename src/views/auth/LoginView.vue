<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { safeRedirect } from '@/utils/permissions';
import AuthLayout from '@/components/auth/AuthLayout.vue';
import SignInForm from '@/components/auth/SignInForm.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const points = [
  { title: 'Stock levels', text: 'Current quantities for every product and location.' },
  { title: 'Stock movements', text: 'Receiving, issuing, transfers and adjustments on record.' },
  { title: 'Reorder alerts', text: 'Low-stock, reorder and expiry notices for the team.' },
];

// Already signed in: go straight to the requested page.
onMounted(() => {
  auth.error = null;
  if (auth.isAuthenticated) router.replace(safeRedirect(route.query.redirect, '/dashboard'));
});
onBeforeUnmount(() => { auth.error = null; });

const submit = async ({ email, password }) => {
  if (auth.loading) return;
  try {
    await auth.login(email, password);
    router.replace(safeRedirect(route.query.redirect, '/dashboard'));
  } catch {
    // auth.error is shown by the form
  }
};
</script>

<template>
  <AuthLayout
    variant="staff"
    eyebrow="Walang Brownout Appliances"
    heading="Appliance inventory and stock control for the store."
    description="Monitor appliance stock levels, record stock movements and respond to reorder alerts from one workspace."
    :points="points"
  >
    <div class="mb-8">
      <h2 class="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
      <p class="mt-2 text-sm text-slate-500">Use the email address and password provided by your organization.</p>
    </div>

    <SignInForm
      id-prefix="login"
      @submit="submit"
      :busy="auth.loading"
      :error="auth.error || ''"
      :notice="route.query.expired === 'true' ? 'Your session has ended. Please sign in again to continue.' : ''"
    />

    <p class="mt-8 text-sm text-slate-500">
      Forgot your password or need an account? Contact your system administrator.
    </p>

    <template #footer>
      <span>Authorized use only. Sign-in activity is recorded.</span>
    </template>
  </AuthLayout>
</template>
