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
 * A 401 from any request means the session is no longer valid or has been revoked.
 * Clear session state and redirect user cleanly to sign in.
 */
setUnauthorizedHandler(() => {
  auth.clearSession();
  const current = router.currentRoute.value;
  if (!current.meta.public) {
    router.replace({ name: 'login', query: { redirect: current.fullPath } });
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
