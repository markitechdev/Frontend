# Frontend Development Backlog

**Author:** jhnyz (Project Manager)  
**Target Repository:** Frontend (`markitechdev/Frontend`)  
**Status:** FOR QA (Implementation Complete)  
**Date:** 2026-10-11  

---

### Task FE-01: Secure Login Page & Strip Demo Credentials from Production
- **Task:** Remove Hardcoded Demo Accounts and Add Form Pre-validation
- **Source:** QA Review `docs/qa/super-admin-login.md`
- **Repository:** Frontend
- **Priority:** P1
- **Owner:** Frontend Developer
- **Status:** FOR QA
- **Dependencies:** None
- **Acceptance Criteria:**
  - Demo accounts panel is only rendered when `import.meta.env.DEV` evaluates to true.
  - Production build bundle contains zero hardcoded password strings.
  - Email format and password minimum length (>=6 characters) validated before network dispatch.
  - Submit button disabled with spinner during authentication.
- **QA Required:** Yes

---

### Task FE-02: Cryptographic Permission Verification & Tamper Resistance
- **Task:** Validate User Permissions with Backend on App Startup
- **Source:** QA Review `docs/qa/frontend-permissions.md`
- **Repository:** Frontend
- **Priority:** P1
- **Owner:** Frontend Developer
- **Status:** FOR QA
- **Dependencies:** Backend Permission Endpoints
- **Acceptance Criteria:**
  - Application calls `authStore.refreshProfile()` on startup to re-sync claims from server.
  - LocalStorage edits to `ims_user.permissions` are overwritten by server claims.
  - Action buttons dynamically reflect verified permissions via `v-if="auth.can(...)"`.
- **QA Required:** Yes

---

### Task FE-03: Action Button Submission Locking & Duplicate Prevention
- **Task:** Implement Button Busy State and Disable Double Clicks
- **Source:** QA Review `docs/qa/system-loading-states.md`
- **Repository:** Frontend
- **Priority:** P1
- **Owner:** Frontend Developer
- **Status:** FOR QA
- **Dependencies:** None
- **Acceptance Criteria:**
  - Modal action buttons disable immediately upon click during asynchronous mutations.
  - Visual spinner displays inside the button while in-flight.
  - Rapid double-clicks trigger only a single network request.
- **QA Required:** Yes

---

### Task FE-04: Mobile Slide-Over Navigation Drawer
- **Task:** Build Responsive Mobile Drawer with Hamburger Toggle
- **Source:** QA Review `docs/qa/ui-ux-consistency.md`
- **Repository:** Frontend
- **Priority:** P1
- **Owner:** Frontend Developer
- **Status:** FOR QA
- **Dependencies:** None
- **Acceptance Criteria:**
  - Viewports below 1024px display a hamburger menu icon in `AppTopbar.vue`.
  - Tapping hamburger opens slide-over drawer with backdrop overlay.
  - Selecting any navigation link smoothly navigates and closes the drawer.
- **QA Required:** Yes

---

### Task FE-05: Client-Side Navigation Data Caching & Filter Sync
- **Task:** Add Store Caching, Input Debouncing, and URL Query Filter Sync
- **Source:** QA Review `docs/qa/rendering-and-caching.md`
- **Repository:** Frontend
- **Priority:** P2
- **Owner:** Frontend Developer
- **Status:** FOR QA
- **Dependencies:** None
- **Acceptance Criteria:**
  - Returning to `/dashboard` renders cached data instantly without full-screen loading placeholder.
  - Search inputs on data tables use 350ms debouncing.
  - Table search, filter, and page numbers sync with URL query parameters (`route.query`).
  - Browser Back from product detail view restores previous filter and page state.
- **QA Required:** Yes

---

### Task FE-06: Skeleton Loaders & Error Retry Banners
- **Task:** Build Skeleton Cards/Tables and Add In-Component Error Retry States
- **Source:** QA Review `docs/qa/system-loading-states.md`
- **Repository:** Frontend
- **Priority:** P2
- **Owner:** Frontend Developer
- **Status:** FOR QA
- **Dependencies:** None
- **Acceptance Criteria:**
  - Pulse-animated skeleton loaders replace plaintext "Loading..." placeholders across views.
  - Eliminates cumulative layout shift (CLS).
  - Failed data requests render an in-component error banner with a "Retry" button.
- **QA Required:** Yes

---

### Task FE-07: Horizontal Progress Bar Visualization Polish
- **Task:** Add Tooltips, Minimum Width Scaling, and Fix Character Encoding
- **Source:** QA Review `docs/qa/horizontal-graph.md`
- **Repository:** Frontend
- **Priority:** P2
- **Owner:** Frontend Developer
- **Status:** FOR QA
- **Dependencies:** None
- **Acceptance Criteria:**
  - Hovering on horizontal bars displays interactive tooltip with values, counts, and percentage shares.
  - Low-volume categories enforce a minimum visible bar width of 2% / 6px.
  - Encoding artifact `A` in `ReportsView.vue` is replaced with standard bullet separator.
  - Labels wrap gracefully on mobile viewports.
- **QA Required:** Yes

---

### Task FE-08: Fix Route History Trapping on Access Denied View
- **Task:** Eliminate Browser Back Redirect Looping on `/forbidden`
- **Source:** QA Review `docs/qa/client-side-routing.md`
- **Repository:** Frontend
- **Priority:** P2
- **Owner:** Frontend Developer
- **Status:** FOR QA
- **Dependencies:** None
- **Acceptance Criteria:**
  - Route guards use `router.replace({ name: 'forbidden' })` instead of push.
  - Browser Back button exits cleanly to the previous authorized view without looping.
  - Document titles render clean separators (`Dashboard | IMS`).
- **QA Required:** Yes

---

### Task FE-09: Standardize Deletion Modals and Table Column Pinning
- **Task:** Replace Native Alerts with Custom Modals and Add Mobile Column Pinning
- **Source:** QA Review `docs/qa/ui-ux-consistency.md`
- **Repository:** Frontend
- **Priority:** P3
- **Owner:** Frontend Developer
- **Status:** FOR QA
- **Dependencies:** Task FE-04
- **Acceptance Criteria:**
  - Replace all native `window.confirm()` calls with `ModalDialog.vue` danger dialogs.
  - Primary SKU/Name column on mobile tables is sticky-pinned on horizontal scroll.
  - Consistent padding and input heights applied across all form dialogs.
- **QA Required:** Yes
