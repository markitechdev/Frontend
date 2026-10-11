# QA Review: System Loading States, Skeletons & Submission Handling

**Repository:** Frontend (`markitechdev/Frontend`)  
**Target:** `src/views/DashboardView.vue`, `src/views/inventory/InventoryView.vue`, `src/views/ReportsView.vue`, `src/components/ui/DataTable.vue`, `src/components/ui/ModalDialog.vue`  
**QA Reviewer:** Jaymartimpas0-prog  
**Review Date:** 2026-10-11  

---

### Finding 1: Primitive Plaintext Loading Placeholders Instead of Skeleton Loaders

**Issue:**  
Core Views Use Static Text Centered in Empty Containers Causing Cumulative Layout Shift

**Repository:**  
Frontend

**Area:**  
`src/views/DashboardView.vue` (Line 46), `src/views/ReportsView.vue` (Line 96), `src/views/inventory/InventoryView.vue`

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Emulate "Slow 3G" network throttling in browser devtools.
2. Navigate to `/dashboard` or `/reports`.
3. Observe page showing only: `Loading dashboard...` or `Building report...`.
4. Once data arrives after 2 seconds, the entire UI pops in abruptly, displacing layout elements.

**Expected Result:**  
Data-dense dashboard and report pages should display structured skeleton loaders matching the dimensions of stat cards, chart containers, and table columns to provide visual hierarchy and eliminate layout shifts.

**Actual Result:**  
Plain text indicator `<div class="text-center py-16 text-slate-400">Loading...</div>` renders in place of actual layout components.

**Developer Task:**  
Implement reusable skeleton components (`CardSkeleton.vue`, `TableSkeleton.vue`) across dashboard, inventory tables, and reports.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 2: Unprotected Form Action Buttons Allow Rapid Duplicate Submissions

**Issue:**  
Modal Dialog Action Buttons Lack Busy Loading States and Click Debouncing

**Repository:**  
Frontend

**Area:**  
`src/components/ui/ModalDialog.vue`, `src/views/inventory/MovementsView.vue`, `src/views/admin/UsersView.vue`

**Priority:**  
P1

**Severity:**  
High

**Steps to Reproduce:**
1. Open the "Record Movement" modal on `/movements`.
2. Enter product, select "stock_in", and specify quantity.
3. Rapidly double-click or triple-click the "Save Movement" submit button.
4. Check the stock movements table.

**Expected Result:**  
On first click, the submit button should immediately transition to a disabled state with a loading spinner, preventing secondary click events until the request promise resolves or rejects.

**Actual Result:**  
Button remains enabled and clickable during asynchronous API execution, allowing users to submit duplicate stock transactions before the modal closes.

**Developer Task:**  
Bind a `submitting` boolean state to modal primary buttons, disable the button on click, and display an inline loading spinner.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 3: Missing In-Component Failure and Retry States on API Request Failure

**Issue:**  
Page Displays Blank Containers Without Retry Triggers When Network Requests Fail

**Repository:**  
Frontend

**Area:**  
`src/views/DashboardView.vue` (Lines 29-33), `src/views/inventory/InventoryView.vue`

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Disable network connectivity or trigger 500 error on `/api/dashboard`.
2. Reload `/dashboard`.
3. Observe transient toast notification appearing and fading out.
4. Inspect remaining screen.

**Expected Result:**  
When initial data loading fails, the container should render an error state banner with an explicit "Try Again / Reconnect" button.

**Actual Result:**  
`loading` flag resets to `false`, leaving a completely blank page with missing stat cards and broken panels after the toast disappears.

**Developer Task:**  
Add dedicated `error` state handling with retry action buttons inside component templates.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog
