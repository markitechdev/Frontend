# QA Review: Horizontal Bar Graph & Data Visualization Implementation

**Repository:** Frontend (`markitechdev/Frontend`)  
**Target:** `src/views/DashboardView.vue` ("Alerts by Priority"), `src/views/ReportsView.vue` ("Stock Value by Category")  
**QA Reviewer:** Jaymartimpas0-prog  
**Review Date:** 2026-10-11  

---

### Finding 1: Missing Tooltips and Interactive Data Granularity on Progress Bars

**Issue:**  
Horizontal Bar Elements Lack Hover Tooltips, Percentages, and Detailed Breakdown

**Repository:**  
Frontend

**Area:**  
`src/views/DashboardView.vue` (Lines 111-125), `src/views/ReportsView.vue` (Lines 104-113)

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Navigate to `/dashboard` and scroll to "Alerts by Priority".
2. Hover over the horizontal bar for "Critical" or "High".
3. Notice that no tooltip appears showing percentage of total alerts, creation timestamps, or drill-down details.
4. Navigate to `/reports` and hover over the "Stock Value by Category" horizontal bars.
5. Notice absence of hover state, exact SKU counts, or percentage of total portfolio.

**Expected Result:**  
Horizontal bars should support accessible hover tooltips (using `@mouseenter` or title attributes / tooltip components) detailing exact metric values, percentage proportion against whole, and interactive pointer cursor.

**Actual Result:**  
Bars are static, inert `<div>` elements without hover interaction or explanatory tooltips.

**Developer Task:**  
Add interactive tooltips to horizontal visualization bars with percentage share and detailed metric breakdowns.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 2: Linear Scaling Distortion Makes Low-Volume Categories Invisible

**Issue:**  
Single High-Value Outlier Collapses Smaller Category Bars to 0% Rendered Width

**Repository:**  
Frontend

**Area:**  
`src/views/ReportsView.vue` (Line 110)

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Create a category "Heavy Machinery" with stock value of ₱1,000,000.
2. Create a category "Fasteners" with stock value of ₱1,000.
3. Open `/reports` and view "Stock Value by Category".
4. Calculate rendered width for "Fasteners": `(1,000 / 1,000,000) * 100 = 0.1%`.

**Expected Result:**  
Non-zero categories should enforce a minimum visual indicator width (e.g. `min-w-[6px]` or minimum 2%) so users can visibly see that data exists for that category.

**Actual Result:**  
Linear proportion renders the bar with 0.1% width, effectively invisible to the naked eye and giving the false impression of 0 stock.

**Developer Task:**  
Enforce a minimum bar width constraint for non-zero items (e.g. `Math.max(2, percentage)`) or offer logarithmic scale options for high variance datasets.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 3: Text Overflow, Broken Encoding Characters, and Mobile Squeezing

**Issue:**  
Mojibake Character Artifact and Label Truncation on Small Viewports

**Repository:**  
Frontend

**Area:**  
`src/views/ReportsView.vue` (Line 106)

**Priority:**  
P2

**Severity:**  
Medium

**Steps to Reproduce:**
1. Open `/reports` in browser.
2. Inspect the label above each category bar:  
   `{{ peso(c.value) }} A {{ c.quantity }} units`.
3. Notice corrupt UTF-8 character artifact `A` rendered between currency and unit count.
4. Switch to mobile view (viewport width 375px) with long category names (e.g. "Telecommunications Hardware Components").
5. Observe label text colliding with the right-aligned monetary valuation.

**Expected Result:**  
Category labels should have clean ellipsis truncation with full text tooltip, clean bullet separation (`•` or `&bull;`), and responsive flex-wrap behavior on narrow viewports.

**Actual Result:**  
Encoding artifact `A` is visibly rendered, and narrow viewports compress category names against values without wrapping.

**Developer Task:**  
Fix character encoding for the separator symbol and adjust flex layout classes to wrap gracefully on mobile screens.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog

---

### Finding 4: Misleading Full-Width Display on Single-Record Datasets

**Issue:**  
Single Category or Alert Automatically Renders at 100% Width Without Scale Reference

**Repository:**  
Frontend

**Area:**  
`src/views/DashboardView.vue` (Line 123), `src/views/ReportsView.vue` (Line 110)

**Priority:**  
P3

**Severity:**  
Low

**Steps to Reproduce:**
1. Clear alerts so that only 1 "Low" alert exists.
2. View "Alerts by Priority" on `/dashboard`.
3. Notice the bar for "Low" fills 100% of the horizontal container.

**Expected Result:**  
When only one item is present, the chart should provide context or an explicit denominator/scale indicator so users do not mistake a single low-priority alert for maximum system threshold capacity.

**Actual Result:**  
A solitary item fills 100% of the bar width unconditionally.

**Developer Task:**  
Display contextual scale labels or reference maximum threshold values rather than simple relative ratio against solitary items.

**Status:**  
Open

**QA Reviewer:**  
Jaymartimpas0-prog
