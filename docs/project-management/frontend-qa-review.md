# Project Management: Frontend QA Findings Review

**Author:** jhnyz (Project Manager)  
**Email:** lavinajhanyz029@gmail.com  
**Target Repository:** Frontend (`markitechdev/Frontend`)  
**Source QA Reviewer:** Jaymartimpas0-prog  
**Date:** 2026-10-11  

---

## 1. Executive Summary

This document reviews and organizes the client-side QA findings identified by QA Reviewer Jaymartimpas0-prog across the IMS Frontend project (`markitechdev/Frontend`). It serves as the baseline for the Frontend engineering backlog and sprint planning.

---

## 2. Review of Frontend QA Domains

### 2.1 Super Admin Login UI
- **Findings:** Pre-populated demo accounts with plaintext passwords (`[redacted]`) embedded in the client source bundle; absence of input length pre-validation; generic error display with no field association.
- **Priority:** P1 (High)
- **Target Component:** `src/views/auth/LoginView.vue`

### 2.2 Client-Side Permissions & LocalStorage Security
- **Findings:** User permissions hydrate from unencrypted, user-editable `localStorage` JSON strings (`ims_user`), allowing low-privilege users to unlock administrative sidebar items and routes via browser DevTools; action buttons visible to unauthorized roles before failing at API layer.
- **Priority:** P1 (High)
- **Target Components:** `src/stores/auth.js`, `src/components/layout/AppSidebar.vue`, `src/router/index.js`

### 2.3 System Loading States & Action Protection
- **Findings:** Action buttons in modals and forms remain clickable during asynchronous submissions, permitting duplicate mutations; lack of skeleton loaders causes cumulative layout shift (CLS); plain text centered "Loading..." placeholders.
- **Priority:** P1 / P2
- **Target Components:** `src/components/ui/ModalDialog.vue`, `src/views/inventory/MovementsView.vue`, Core Views

### 2.4 Rendering & Client Data Caching
- **Findings:** Dashboard and tables destroy and refetch data on every navigation transition; reports view executes 4 heavy simultaneous API calls on every date change; search inputs lack debouncing (350ms); table search and filter states reset on Back navigation.
- **Priority:** P2 (Medium)
- **Target Views:** `src/views/DashboardView.vue`, `src/views/ReportsView.vue`, `src/views/inventory/InventoryView.vue`

### 2.5 Horizontal Graph Visualization
- **Findings:** "Alerts by Priority" and "Stock Value by Category" horizontal bars lack hover tooltips; linear scaling collapses low-volume categories to invisible 0.1% slivers; corrupt character encoding (`A` mojibake); single records scale to 100% capacity misleadingly.
- **Priority:** P2 (Medium)
- **Target Views:** `src/views/DashboardView.vue`, `src/views/ReportsView.vue`

### 2.6 Client-Side Routing & Navigation
- **Findings:** Browser "Back" button traps users in an infinite redirect loop on the Access Denied (`/forbidden`) view; missing breadcrumbs on deep sub-routes (`/inventory/:id`); document title formatting contains character artifacts.
- **Priority:** P2 / P3
- **Target Files:** `src/router/index.js`, `src/views/ForbiddenView.vue`

### 2.7 UI/UX & Responsive Layout
- **Findings:** Missing mobile navigation drawer / hamburger toggle for viewports below 1024px; inconsistent deletion prompts mixing native `window.confirm()` with custom modals; wide data tables overflow without frozen identifier columns on small screens.
- **Priority:** P1 / P3
- **Target Layouts:** `src/components/layout/AppLayout.vue`, `src/components/layout/AppTopbar.vue`, `src/components/ui/DataTable.vue`

---

## 3. Frontend QA Findings Summary Matrix

| Finding Area | Issue Title | Severity | Priority | Affected File | Recommended Frontend Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Login UI** | Exposed Demo Passwords | High | P1 | `LoginView.vue` | Guard behind `import.meta.env.DEV` |
| **Permissions** | LocalStorage Tampering | High | P1 | `auth.js` | Re-verify permissions with backend on launch |
| **Loading** | Duplicate Click Submissions | High | P1 | `ModalDialog.vue` | Add busy state and disable submit button |
| **UI/UX** | Missing Mobile Menu Drawer | High | P1 | `AppTopbar.vue` | Build responsive slide-over drawer |
| **Caching** | Redundant Nav Fetching | High | P2 | `DashboardView.vue` | Implement Pinia/SWR client-side store cache |
| **Graph** | Invisibility of Small Values | Medium | P2 | `ReportsView.vue` | Apply `Math.max(2, %)` minimum bar width |
| **Routing** | Browser Back Trapping Loop | Medium | P2 | `router/index.js` | Use `router.replace({ name: 'forbidden' })` |
| **Loading** | Absence of Skeleton Loaders | Medium | P2 | Core Views | Implement Card & Table skeleton loaders |
| **UI/UX** | Mixed Deletion Confirmations | Medium | P3 | Various Views | Standardize on `ModalDialog.vue` danger modal |
