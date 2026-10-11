import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import { setUnauthorizedHandler, setForbiddenHandler } from './api/client';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

const auth = useAuthStore();

/**
 * Re-validate profile and permissions on startup to prevent client-side localStorage tampering.
 * Server claims always override any local modification.
 */
if (auth.token) {
  auth.refreshProfile().catch(() => {});
}

/**
 * A 401 from any request means the session is no longer valid or has expired.
 * Authoritatively clear the authenticated session and redirect to the corresponding login interface.
 */
setUnauthorizedHandler(() => {
  const current = router.currentRoute.value;
  const isSuperAdminContext = auth.isSuperAdmin || current.path.startsWith('/super-admin');

  auth.clearSession();

  if (!current.meta.public) {
    if (isSuperAdminContext) {
      router.replace({
        name: 'super-admin-login',
        query: { redirect: current.fullPath, expired: 'true' },
      });
    } else {
      router.replace({
        name: 'login',
        query: { redirect: current.fullPath, expired: 'true' },
      });
    }
  }
});

/**
 * A 403 Forbidden means backend authorization denied access to the requested resource.
 * Redirect cleanly to forbidden view without trapping navigation history.
 */
setForbiddenHandler(() => {
  const current = router.currentRoute.value;
  if (current.name !== 'forbidden') {
    router.replace({ name: 'forbidden' });
  }
});

app.mount('#app');
