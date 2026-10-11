# QA Review: Frontend Role-Based Access Control & Permission Enforcement

**Repository:** Frontend (`markitechdev/Frontend`)  
**Target:** `src/stores/auth.js`, `src/router/index.js`, `src/components/layout/AppSidebar.vue`  
**QA Reviewer:** Jaymartimpas0-prog  
**Review Date:** 2026-10-11  

---

### Finding 1: Client-Side Permission Tampering via Unsigned LocalStorage Manipulation

**Issue:**  
Client Grants Full Administrative UI Access by Editing LocalStorage JSON

**Repository:**  
Frontend

**Area:**  
`src/stores/auth.js` (Lines 8-17), `src/router/index.js` (Lines 44-53)

**Priority:**  
P1

**Severity:**  
High

**Steps to Reproduce:**
1. Log in with low-privileged account "Staff Admin" (`staff@ims.local`).
2. Notice the sidebar hides "User Management", "Roles & Permissions", and "System Activity".
3. Open browser DevTools -> Application -> Local Storage -> `ims_user`.
4. Edit the JSON string: add `"roles.manage"`, `"users.manage"`, and `"logs.view"` to the `permissions` array.
5. Refresh the browser page.

**Expected Result:**  
User permissions should be validated cryptographically (via signed JWT claims or mandatory server validation handshake on route changes) rather than trusting raw editable browser localStorage strings.

**Actual Result:**  
The UI immediately renders all restricted administrator navigation items in `AppSidebar.vue` and allows navigation into `/users` and `/roles` views without client-side blocking.

**Developer Task:**  
Extract permissions from verified JWT claims or ensure client store continuously re-validates profile permissions against `GET /api/auth/me` on startup.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 2: Lack of Live Permission Invalidation for Active User Sessions

**Issue:**  
Revoked Roles and Permissions Persist in Active Client Session Indefinitely

**Repository:**  
Frontend

**Area:**  
`src/stores/auth.js` (Lines 52-61)

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. User A logs in as "Warehouse Admin" on Device 1.
2. Super Admin removes "inventory.update" permission from Warehouse Admin in the system settings.
3. User A continues browsing the catalog on Device 1 without logging out.

**Expected Result:**  
Session should periodically poll or listen to permission update events, disabling editing buttons as soon as permissions are revoked.

**Actual Result:**  
User A retains outdated permissions in local state indefinitely until they manually perform a full logout or token refresh.

**Developer Task:**  
Call `authStore.refreshProfile()` on key navigation events or handle 403 Forbidden interceptor by triggering immediate profile refresh.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 3: Inconsistent Action Button Visibility on Restricted Actions

**Issue:**  
Certain Action Buttons Render Visible to Unauthorized Roles Before Failing at API Layer

**Repository:**  
Frontend

**Area:**  
`src/views/inventory/ProductDetailView.vue`, `src/views/admin/RolesView.vue`

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Log in as a role with `products.view` but without `products.manage`.
2. Open `/inventory/:id`.
3. Observe presence of clickable edit actions or action menus that trigger an unexpected red error toast upon click.

**Expected Result:**  
Buttons performing restricted mutations (`Edit Product`, `Delete Role`, `Adjust Inventory`) should have matching `v-if="auth.can('...')" directives to hide restricted actions from unauthorized viewers.

**Actual Result:**  
Buttons are visible to users lacking execution privileges, creating poor UX and unnecessary failed API calls.

**Developer Task:**  
Audit all action buttons and dialog triggers to ensure uniform conditional rendering via `v-if="auth.can(...)"`.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog
