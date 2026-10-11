# Frontend Task Acceptance Criteria & Testing Verification

**Author:** jhnyz (Project Manager)  
**Target Repository:** Frontend (`markitechdev/Frontend`)  
**Date:** 2026-10-11  

---

## 1. Acceptance Criteria Checklist

### FE-01: Secure Login Page
- [ ] Demo accounts panel renders only in development environments (`import.meta.env.DEV`).
- [ ] Production build contains zero hardcoded password strings.
- [ ] Email and password fields show styled inline error labels when empty or invalid.
- [ ] Sign-in button is disabled and displays a spinner during authentication.
- [ ] Authenticated users navigating to `/login` are immediately redirected to `/dashboard`.

### FE-02: LocalStorage Tamper Resistance
- [ ] App calls `authStore.refreshProfile()` on startup to re-validate claims against server.
- [ ] Modifying `ims_user.permissions` in DevTools does not grant access to restricted routes.
- [ ] Action buttons check verified server claims via `v-if="auth.can(...)"`.

### FE-03: Action Button Submission Locking
- [ ] Buttons enter disabled state with spinner immediately upon click during mutation calls.
- [ ] Rapid double-clicks dispatch exactly one network request.
- [ ] Button re-enables properly if the API call rejects or fails.

### FE-04: Mobile Slide-Over Navigation Drawer
- [ ] Viewports under 1024px display an accessible hamburger icon in the topbar.
- [ ] Tapping hamburger smoothly reveals a slide-over navigation drawer.
- [ ] Selecting a route navigates and dismisses the drawer cleanly.

### FE-05: SWR/Pinia Store Caching & Filter Sync
- [ ] Navigating away from `/dashboard` and returning renders data instantly from store cache.
- [ ] Search inputs enforce 350ms debouncing before triggering network requests.
- [ ] Table search, status filter, and pagination page sync with URL query parameters (`route.query`).
- [ ] Browser Back from `/inventory/:id` restores exact previous search filter and table page.

### FE-06: Skeletons & Error Retry Banners
- [ ] Pulsing skeleton loaders replace centered "Loading..." strings across dashboard and tables.
- [ ] Eliminates cumulative layout shift (CLS).
- [ ] Failed requests render an in-component error banner with a functioning "Retry" button.

### FE-07: Horizontal Graph Polish
- [ ] Hovering on horizontal bars displays interactive tooltip with values and percentage share.
- [ ] Low-volume categories maintain a minimum visible bar width (2% / 6px).
- [ ] Character encoding artifact (`A`) is replaced with standard bullet separator.
- [ ] Labels wrap cleanly on mobile screens without overflowing numbers.

### FE-08: Route History Trapping Fix
- [ ] Access Denied redirects use `router.replace({ name: 'forbidden' })`.
- [ ] Browser Back on `/forbidden` cleanly returns to the previous accessible view.
- [ ] Browser tab document titles format cleanly (`Dashboard | IMS`).

### FE-09: Modal Dialog Standardization
- [ ] Replaces all native `window.confirm()` calls with `ModalDialog.vue` danger modals.
- [ ] Primary SKU/name column on mobile tables is sticky-pinned on horizontal scroll.
