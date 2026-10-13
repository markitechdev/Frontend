import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import { useToastStore } from './stores/toast';
import { setUnauthorizedHandler, setForbiddenHandler } from './api/client';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

const auth = useAuthStore();

/**
 * A 401 that survived a token refresh means the session is really over
 * (expired, revoked, or the account was deactivated). Clear it and send the
 * user to the matching login page, remembering where they were.
 */
setUnauthorizedHandler((err, ctx) => {
  const current = router.currentRoute.value;
  // Only the side that made the request is signed out (staff and Super Admin
  // sessions are separate).
  const side = ctx || auth.context;
  auth.clearSession(side);
  // During the very first navigation the router guard handles the redirect
  // itself (and keeps the requested deep link).
  if (!current.matched.length || side !== auth.context) return;
  const isSuperAdminContext = side === 'super_admin';

  if (!current.meta.public) {
    router.replace({
      name: isSuperAdminContext ? 'super-admin-login' : 'login',
      query: { redirect: current.fullPath, expired: 'true' },
    });
  }
});

/**
 * A 403 on a page-data request means the backend refused this page for the
 * current role (e.g. permissions changed since sign-in). Refused *actions* are
 * shown as toasts by the views and do not trigger this.
 */
setForbiddenHandler((err) => {
  const current = router.currentRoute.value;
  if (current.meta.public || current.name === 'forbidden') return;
  // Re-read permissions so the sidebar matches what the server now allows.
  auth.refreshProfile();
  router.replace({ name: 'forbidden', query: { from: current.fullPath } });
  useToastStore().error(err?.message || 'You do not have access to that page.');
});

// Surface unexpected render errors instead of a silent blank page.
app.config.errorHandler = (err) => {
  console.error(err);
  try { useToastStore().error('Something went wrong while displaying this page.'); } catch { /* ignore */ }
};

app.mount('#app');

/* Fade out the loading screen from index.html once the first page is ready.
   On the first visit in a tab it stays until the logo animation has played. */
const splash = document.getElementById('ims-splash');
if (splash) {
  const info = window.__imsSplash || { start: Date.now(), full: false };
  const minVisible = info.full ? 1700 : 0;
  router.isReady().catch(() => {}).finally(() => {
    const wait = Math.max(0, minVisible - (Date.now() - info.start));
    setTimeout(() => {
      splash.classList.add('ims-splash--out');
      setTimeout(() => splash.remove(), 400);
    }, wait);
  });
}
