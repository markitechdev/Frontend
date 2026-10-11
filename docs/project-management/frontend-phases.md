# Project Management: Frontend Phased Execution Roadmap

**Author:** jhnyz (Project Manager)  
**Target Repository:** Frontend (`markitechdev/Frontend`)  
**Date:** 2026-10-11  

---

## 1. Phased Delivery Roadmap

Frontend work is coordinated into four structured phases corresponding with the global release roadmap:

### Phase 1: Security, Access UI & Action Protection
- **Focus:** Closing client-side attack surfaces and locking down mutation buttons.
- **Tasks:**
  - Strip hardcoded demo accounts from production builds.
  - Implement client-side input validation and error styling.
  - Re-verify permissions with backend on application boot.
  - Add button busy states to disable duplicate submissions.

### Phase 2: Navigation Integrity & Route Guards
- **Focus:** Routing reliability, history integrity, and session redirection.
- **Tasks:**
  - Replace `router.push` with `router.replace` on `/forbidden` to stop browser Back trapping.
  - Auto-redirect already-authenticated users away from `/login`.
  - Handle 401 session expiration cleanly across route transitions.
  - Add breadcrumb navigation to sub-routes.

### Phase 3: Performance, Caching & Visual Feedback
- **Focus:** Eliminating lag, visual shifts, and redundant network requests.
- **Tasks:**
  - Build structural skeleton card and table loaders.
  - Implement Pinia/SWR store caching for dashboard metrics.
  - Add 350ms search debouncing and sync filter states with URL queries.
  - Add in-component error retry banners.

### Phase 4: Data Visualization & UI Standardization
- **Focus:** Usability, responsive layout, and visual polish.
- **Tasks:**
  - Build responsive mobile slide-out navigation drawer with topbar hamburger toggle.
  - Implement hover tooltips, minimum width scaling, and text encoding fix for horizontal bars.
  - Standardize all deletion prompts with `ModalDialog.vue`.
  - Sticky-pin primary columns on mobile tables.
