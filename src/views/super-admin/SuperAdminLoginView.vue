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
  { title: 'User accounts', text: 'Create accounts, assign roles and manage access.' },
  { title: 'Roles and permissions', text: 'Define what each role can view and change.' },
  { title: 'Audit records', text: 'Review sign-ins and administrative changes.' },
];

onMounted(() => {
  auth.error = null;
  if (auth.isAuthenticated && auth.isSuperAdmin) {
    router.replace(safeRedirect(route.query.redirect, '/super-admin/dashboard'));
  }
});
onBeforeUnmount(() => { auth.error = null; });

const submit = async ({ email, password }) => {
  if (auth.loading) return;
  try {
    await auth.superAdminLogin(email, password);
    router.replace(safeRedirect(route.query.redirect, '/super-admin/dashboard'));
  } catch {
    // auth.error is shown by the form
  }
};
</script>

<template>
  <AuthLayout
    variant="admin"
    eyebrow="System Administration"
    heading="Administration of users, roles and system records."
    description="This area is limited to system administrators of the Inventory Management System."
    :points="points"
  >
    <div class="mb-8">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-2xl font-semibold tracking-tight text-slate-900">Administrator sign in</h2>
      </div>
      <p class="mt-2 text-sm text-slate-500">Sign in with your administrator account.</p>
    </div>

    <SignInForm
      id-prefix="admin"
      :busy="auth.loading"
      :error="auth.error || ''"
      :notice="route.query.expired === 'true' ? 'Your session has ended. Please sign in again to continue.' : ''"
      @submit="submit"
    />

    <p class="mt-8 text-sm text-slate-500">
      Not an administrator?
      <RouterLink to="/login" class="font-medium text-navy-700 hover:text-navy-900 underline-offset-2 hover:underline">Go to staff sign in</RouterLink>
    </p>

    <template #footer>
      <span>Restricted area. All sign-in attempts are recorded.</span>
    </template>
  </AuthLayout>
</template>
