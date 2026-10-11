# QA Review: User Interface & User Experience Design Consistency

**Repository:** Frontend (`markitechdev/Frontend`)  
**Target:** Design system components (`src/components/ui/`), layouts (`src/components/layout/`), responsive styling  
**QA Reviewer:** Jaymartimpas0-prog  
**Review Date:** 2026-10-11  

---

### Finding 1: Missing Mobile Hamburger Menu Drawer for Sidebar Navigation

**Issue:**  
Mobile Viewports Lack Navigation Menu Drawer for Accessing System Modules

**Repository:**  
Frontend

**Area:**  
`src/components/layout/AppLayout.vue`, `src/components/layout/AppSidebar.vue`

**Priority:**  
P1

**Severity:**  
High

**Steps to Reproduce:**
1. Open the application on a mobile device or resize browser width below 768px.
2. Observe the sidebar disappearing to save screen real estate.
3. Look at `AppTopbar.vue` for a hamburger menu icon to open navigation.
4. Notice there is no toggleable slide-over drawer to access navigation links on mobile.

**Expected Result:**  
Mobile and tablet viewports (<1024px) should display a prominent hamburger toggle button in the topbar that slides out an accessible navigation drawer.

**Actual Result:**  
Mobile users lose access to navigation menu items once the screen collapses below desktop breakpoint.

**Developer Task:**  
Implement responsive mobile drawer state with backdrop overlay and hamburger button toggle in `AppTopbar.vue`.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 2: Inconsistent Destructive Action Confirmation Dialogs

**Issue:**  
Deletions Mix Native Browser Alert Popups With Styled Modal Components

**Repository:**  
Frontend

**Area:**  
`src/views/admin/UsersView.vue`, `src/views/inventory/SuppliersView.vue`

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Navigate to `/suppliers` and click delete on a supplier row.
2. Observe native browser `confirm('Are you sure?')` dialog.
3. Navigate to `/roles` and observe a styled custom `ModalDialog.vue`.

**Expected Result:**  
All destructive actions (delete, deactivate, reset password) should use the unified `ModalDialog.vue` design system component with red danger confirmation buttons and descriptive impact text.

**Actual Result:**  
Inconsistent UX alternating between crude browser native popups and custom modals.

**Developer Task:**  
Standardize all deletion and confirmation prompts to use `ModalDialog.vue` with appropriate danger tone styling.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 3: Dense Data Tables Cause Horizontal Scroll Clipping on Mobile

**Issue:**  
Wide Table Views Lack Column Prioritization and Sticky Identifiers on Small Screens

**Repository:**  
Frontend

**Area:**  
`src/components/ui/DataTable.vue`, `src/views/ReportsView.vue`

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Open `/inventory` or `/reports` on a smartphone screen (width 390px).
2. Scroll through the table horizontally.
3. Observe losing track of which product row corresponds to which stock and value numbers.

**Expected Result:**  
Primary identifying columns (SKU or Product Name) should remain sticky to the left side during horizontal scrolling, or collapse into stacked mobile card viewports.

**Actual Result:**  
Wide table overflows without frozen columns, forcing tedious back-and-forth horizontal panning.

**Developer Task:**  
Add responsive table card layout or CSS `sticky left-0` to the primary product identifier column.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog
