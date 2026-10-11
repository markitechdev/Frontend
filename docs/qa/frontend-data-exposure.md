# QA Review: Client-Side Data Exposure, Token Storage & DOM Leakage

**Repository:** Frontend (`markitechdev/Frontend`)  
**Target:** `src/stores/auth.js`, `src/views/auth/LoginView.vue`, `src/views/admin/UsersView.vue`  
**QA Reviewer:** Jaymartimpas0-prog  
**Review Date:** 2026-10-11  

---

### Finding 1: Insecure Token and Profile Persistence in LocalStorage Vulnerable to XSS

**Issue:**  
Bearer Access Tokens and Administrative User Objects Stored in Unencrypted LocalStorage

**Repository:**  
Frontend

**Area:**  
`src/stores/auth.js` (Lines 5-27)

**Priority:**  
P1

**Severity:**  
High

**Steps to Reproduce:**
1. Log in as Super Admin.
2. Open browser console and execute `localStorage.getItem('ims_access_token')`.
3. Execute `localStorage.getItem('ims_user')`.
4. Observe the unencrypted Supabase bearer token and complete administrative profile payload.

**Expected Result:**  
Sensitive session tokens should ideally be persisted via HttpOnly, Secure, SameSite cookies to protect credentials against exfiltration via client-side Cross-Site Scripting (XSS) or browser extension compromise.

**Actual Result:**  
Tokens and profile data are stored in accessible `window.localStorage`, completely exposed to any script running in the browser context.

**Developer Task:**  
Migrate authentication tokens to HttpOnly cookie transport or implement memory-only token storage with secure refresh cookie rotation.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 2: Exposure of Employee Contact Phone Numbers in Frontend State

**Issue:**  
Complete Personal Phone Directory Loaded and Retained in Component Memory

**Repository:**  
Frontend

**Area:**  
`src/views/admin/UsersView.vue`, `src/stores/auth.js`

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Log in as any account with user viewing rights.
2. Open Vue Devtools or inspect network responses for `/api/users`.
3. Inspect component reactive state in `UsersView.vue`.
4. Observe personal phone numbers and direct email addresses of all system personnel retained in client memory.

**Expected Result:**  
Contact numbers should only be loaded on-demand when explicitly opening an employee's direct edit profile modal, rather than downloading the entire company's contact sheet into client memory.

**Actual Result:**  
Full directory contact details are eagerly downloaded and retained in reactive memory.

**Developer Task:**  
Exclude sensitive contact fields from the general directory view model and load them strictly on-demand in individual user detail drawers.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 3: Database UUIDs and Internal Identifiers Rendered Directly in the DOM

**Issue:**  
Internal Database Primary Keys Exposed in UI Elements and URLs

**Repository:**  
Frontend

**Area:**  
`src/views/inventory/ProductDetailView.vue`, `src/views/admin/ActivityLogView.vue`

**Priority:**  
P3

**Severity:**  
Low

**Steps to Reproduce:**
1. Open `/activity` (System Activity Log).
2. Inspect table rows.
3. Observe raw internal database UUIDs for `entity_id` and `user_id` rendered directly in table text.

**Expected Result:**  
Internal database primary keys and UUIDs should be translated into human-readable business identifiers (e.g. User Name, Product SKU, Reference Code).

**Actual Result:**  
Raw UUID strings (e.g., `550e8400-e29b-41d4-a716-446655440000`) are shown to end users, exposing internal database design and record identifiers.

**Developer Task:**  
Format entity references using human-readable names and SKUs instead of raw database UUIDs.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog
