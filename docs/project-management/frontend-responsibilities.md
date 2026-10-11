# Project Management: Frontend Engineering Scope & API Contracts

**Author:** jhnyz (Project Manager)  
**Target Repository:** Frontend (`markitechdev/Frontend`)  
**Date:** 2026-10-11  

---

## 1. Frontend Scope of Work

The Frontend engineering team is directly assigned the following components, pages, and client systems:

- **Login & Authentication UI:**
  - `src/views/auth/LoginView.vue`: Pre-validation, field-level error labeling, removing demo accounts from production bundle, and submit button loading state.
- **Client Routing & Navigation:**
  - `src/router/index.js`: Protected navigation guards, replacing push with `router.replace` on `/forbidden`, restoring search/filter states from URL queries, and dynamic document titles.
- **State & Caching:**
  - `src/stores/auth.js`: Verifying claims against server profile on boot; guarding against localStorage tampering.
  - Pinia Store Caching: Caching dashboard metrics and catalog rows to avoid full-screen loading on navigation.
- **Loading & Error Feedback:**
  - Structural skeleton loaders (`CardSkeleton.vue`, `TableSkeleton.vue`) replacing text placeholders.
  - Action button busy locking during mutations across all modal dialogs.
  - In-component error banners with "Retry" action triggers.
- **Data Visualization & Graphs:**
  - Interactive hover tooltips on horizontal bars; minimum width scaling (2% / 6px); fixing character mojibake artifacts.
- **UI & Mobile Consistency:**
  - Mobile slide-over drawer with hamburger button toggle in `AppTopbar.vue`.
  - Standardizing all deletion prompts to use `ModalDialog.vue`.
  - Sticky-pinned SKU/name column on small viewport data tables.

---

## 2. Dependencies on Backend API Contracts

Frontend features require alignment with the following backend contracts:
1. `GET /api/auth/me`: Fast (<20ms) authenticated profile response for client-side startup re-verification.
2. `POST /api/auth/logout`: Server-side session revocation contract.
3. Structured HTTP Error Bodies: Standardized `{ error: { message, code } }` format with accurate 401, 403, and 429 status codes.
