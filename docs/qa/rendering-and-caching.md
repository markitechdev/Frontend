# QA Review: Client-Side Rendering & Data Caching Performance

**Repository:** Frontend (`markitechdev/Frontend`)  
**Target:** `src/views/DashboardView.vue`, `src/views/ReportsView.vue`, `src/views/inventory/InventoryView.vue`, `src/views/inventory/MovementsView.vue`  
**QA Reviewer:** Jaymartimpas0-prog  
**Review Date:** 2026-10-11  

---

### Finding 1: Lack of Client-Side Data Caching on Inter-Page Navigation

**Issue:**  
Dashboard and Core Views Discard Data and Refetch on Every Route Transition

**Repository:**  
Frontend

**Area:**  
`src/views/DashboardView.vue` (Lines 11-38), `src/views/inventory/InventoryView.vue`

**Priority:**  
P1

**Severity:**  
High

**Steps to Reproduce:**
1. Log in and navigate to `/dashboard`. Observe initial API fetch.
2. Click "Inventory" in the sidebar to open `/inventory`.
3. Click "Dashboard" to return to `/dashboard`.
4. Inspect Network tab in developer tools.

**Expected Result:**  
Dashboard data should be cached in memory (via Pinia store, TanStack Query, or stale-while-revalidate pattern) so the page renders instantly when returning, with a silent background re-validation if stale.

**Actual Result:**  
State is completely destroyed on route unmount. Every transition back to `/dashboard` renders a full-screen `Loading dashboard...` spinner and re-executes `dashboardApi.get()`, causing jarring layout shifts and redundant server load.

**Developer Task:**  
Implement caching layer or global dashboard store with configurable time-to-live (TTL) to avoid redundant requests during frequent route transitions.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 2: High Overhead Multi-Resource Fetching on Reports View

**Issue:**  
Reports View Executes Quadruple Full-Table Requests on Mount Without Shared Cache

**Repository:**  
Frontend

**Area:**  
`src/views/ReportsView.vue` (Lines 21-36)

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Navigate to `/reports`.
2. Inspect the Network tab.
3. Observe four simultaneous HTTP calls dispatched:
   - `GET /api/inventory/summary`
   - `GET /api/inventory` (entire product inventory dataset)
   - `GET /api/movements/summary`
   - `GET /api/alerts/summary`
4. Change date filter from or to by 1 day.
5. Observe all 4 heavy endpoints re-fetching simultaneously.

**Expected Result:**  
Shared inventory summary metrics should be reused from the existing inventory cache rather than downloading full inventory collections alongside separate summary endpoints.

**Actual Result:**  
Four heavyweight endpoints are queried together every time `/reports` is mounted or date parameters change, causing high latency on slower network connections.

**Developer Task:**  
Refactor reporting queries to request consolidated report payloads or reuse cached inventory summary data.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 3: Loss of Filter, Search, and Pagination State Upon Navigation

**Issue:**  
Navigating Away From Data Tables Wipes User Filter and Scroll State

**Repository:**  
Frontend

**Area:**  
`src/views/inventory/InventoryView.vue`, `src/views/inventory/MovementsView.vue`

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Navigate to `/inventory`.
2. Type a search query (e.g., "Steel") and select filter status "Low Stock".
3. Advance to pagination page 2.
4. Click on an item row to navigate to `/inventory/:id`.
5. Click the browser "Back" button to return to `/inventory`.

**Expected Result:**  
The table should retain the previous search query ("Steel"), status filter ("Low Stock"), and page number (Page 2) by persisting filter states in URL query parameters (`?search=Steel&status=low_stock&page=2`).

**Actual Result:**  
Filter and pagination states are stored only in local component `ref()`. Navigating back resets all filters to empty, page to 1, and re-executes the default un-filtered query.

**Developer Task:**  
Sync table filter, search, and pagination states to Vue Router query parameters (`route.query`) so browser history preserves navigation state.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 4: Absence of Input Debouncing on Search Filters

**Issue:**  
Real-time Search Inputs Fire Immediate API Requests on Every Keystroke

**Repository:**  
Frontend

**Area:**  
`src/views/inventory/InventoryView.vue`, `src/views/admin/UsersView.vue`

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Open developer tools Network tab on `/inventory`.
2. Type "Microcontroller" rapidly in the search input.
3. Observe 15 distinct HTTP requests dispatched in under 2 seconds.

**Expected Result:**  
Search input should use a 300ms–400ms debounce function so only one request is sent after the user pauses typing.

**Actual Result:**  
Every single character change directly updates the query ref and triggers an immediate server request.

**Developer Task:**  
Apply a debounce wrapper (e.g. `useDebounceFn` or 350ms timeout) to search input event handlers across all table filters.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog
