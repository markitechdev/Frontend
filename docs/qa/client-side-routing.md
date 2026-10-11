# QA Review: Client-Side Routing, Route Guards & Navigation Integrity

**Repository:** Frontend (`markitechdev/Frontend`)  
**Target:** `src/router/index.js`, `src/views/ForbiddenView.vue`, `src/views/NotFoundView.vue`  
**QA Reviewer:** Jaymartimpas0-prog  
**Review Date:** 2026-10-11  

---

### Finding 1: Browser "Back" Trapping Loop on Access Denied (/forbidden) View

**Issue:**  
Navigation Guard Traps Users in an Infinite Redirect Loop on Browser History Back

**Repository:**  
Frontend

**Area:**  
`src/router/index.js` (Lines 44-55)

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Log in as a role without `users.view` permission.
2. Manually enter `/users` in the browser address bar.
3. Observe route guard redirecting user to `/forbidden` ("Access Denied").
4. Click the browser's native "Back" button.

**Expected Result:**  
The browser should return to the last authorized page (e.g., `/dashboard`) or allow the user to exit cleanly without re-triggering the forbidden redirect.

**Actual Result:**  
The browser attempts to load `/users` from history, the guard immediately rejects it, and bounces the user right back to `/forbidden`, trapping them in a history loop.

**Developer Task:**  
Use `router.replace({ name: 'forbidden' })` instead of push when handling unauthorized route attempts to keep the browser history stack clean.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 2: Missing Breadcrumbs and Deep Link Orientation on Sub-routes

**Issue:**  
Product Details Route Lacks Breadcrumbs or Return Path

**Repository:**  
Frontend

**Area:**  
`src/router/index.js` (Line 16), `src/views/inventory/ProductDetailView.vue`

**Priority:**  
P3

**Severity:**  
Low

**Steps to Reproduce:**
1. Open `/inventory/5` directly via shared link or bookmark.
2. Look at header and navigation area.
3. Notice absence of breadcrumb navigation (`Inventory > Product Details`).

**Expected Result:**  
Sub-level pages should render hierarchical breadcrumb trails so users can navigate upward to parent catalogs with one click.

**Actual Result:**  
No breadcrumbs exist; users must rely on generic sidebar links, resetting any prior search context.

**Developer Task:**  
Implement structured breadcrumb component in `AppTopbar.vue` or parent layouts based on `route.matched` metadata.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 3: Document Title Titlebar Character Artifact

**Issue:**  
Mojibake Character Artifact in Browser Tab Title String

**Repository:**  
Frontend

**Area:**  
`src/router/index.js` (Lines 58-62)

**Priority:**  
P3

**Severity:**  
Low

**Steps to Reproduce:**
1. Navigate across various routes in the application.
2. Observe browser tab title tooltip.
3. Notice title displays: `Dashboard ?" Inventory Management System`.

**Expected Result:**  
Page title should render clean ASCII or UTF-8 em-dash or pipe: `Dashboard — Inventory Management System` or `Dashboard | IMS`.

**Actual Result:**  
Malformed UTF-8 dash sequence displays replacement glyphs in browser window titlebars.

**Developer Task:**  
Replace corrupted character sequence in `router.afterEach` with standard pipe ` | ` or ASCII hyphen ` - `.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog
