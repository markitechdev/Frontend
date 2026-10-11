# Frontend Approved Development Scope

**Author:** jhnyz (Project Manager)  
**Email:** lavinajhanyz029@gmail.com  
**Repository:** https://github.com/markitechdev/Frontend  
**Date:** 2026-10-11  
**Status:** APPROVED & BINDING  

---

## 1. Scope Baseline Definition

To guarantee predictable delivery, high code quality, and on-time release of the Inventory Management System (IMS) Frontend v1.0, this document formally specifies the **In-Scope** deliverables, explicit **Out-of-Scope** features, and the **Scope Change Control Process**.

---

## 2. In-Scope Deliverables (v1.0 Milestone)

### 2.1 Authentication & Access Control
- Next.js Edge Middleware for route protection (/admin, /inventory, /audit-logs, /users).
- Session persistence, graceful logout, and automatic session timeout handling.
- Role-based UI element visibility (Admin vs. Staff vs. Viewer).
- Secure environment configuration (removal of hardcoded credentials).

### 2.2 Dashboard & Data Visualization
- Real-time inventory metrics (Total Products, Low Stock Count, Total Stock Value, Out of Stock Items).
- Interactive inventory movement charts (Recharts) with dynamic date filtering (7D, 30D, 90D).
- Loading skeleton components during async data fetching.
- Global React Error Boundary preventing UI crashes.

### 2.3 Inventory Management & Operations
- Inventory product table with column sorting, search filter, and category dropdowns.
- Pagination controls (client/server cursor-based).
- Stock Adjustment Modals (Stock In / Stock Out) with form validation and real-time quantity checks.
- Low stock warning banners and status indicators.

### 2.4 User Experience & Notifications
- Non-blocking toast notifications replacing browser lert() and confirm() dialogs.
- Mobile-responsive navigation bar and drawer menus.
- Standardized modal confirmation dialogs for destructive actions.

---

## 3. Explicitly Out-of-Scope (Deferred to v2.0+)

The following capabilities are strictly excluded from the current v1.0 release cycle:

| Excluded Feature | Justification & Future Target |
| :--- | :--- |
| **Multi-organization / Multi-tenant UI** | Single enterprise instance architecture for v1.0; multi-tenancy scheduled for v2.0. |
| **Native Barcode / QR Scanner Integration** | Hardware camera stream integration requires mobile shell testing; deferred to v1.2. |
| **Offline PWA / Service Worker Caching** | Requires complex IndexedDB background sync; targeted for v2.0. |
| **Real-time Collaboration / WebSockets** | Optimistic polling and manual refresh sufficient for v1.0 inventory transaction velocity. |
| **Custom Report Builder / Drag-and-Drop BI** | Standard CSV/PDF export provided in v1.0; custom report builder scheduled for v2.1. |
| **Multi-Language / Internationalization (i18n)** | System will launch exclusively in English for v1.0 release. |

---

## 4. Scope Change Control Process

Any request to modify, append, or remove items from the approved scope must follow this formal workflow:
1. **Change Request Submission:** Submitted via GitHub Issue with label scope-change-request.
2. **Impact Assessment:** PM and Tech Lead assess impact on timeline, budget, and QA bandwidth.
3. **Approval Threshold:** Changes require written sign-off by Project Manager (jhnyz) and QA Reviewer (Jaymartimpas0-prog).
4. **Scope Trade-off:** Any added feature must be balanced by deselecting an equivalent story point feature of lower priority.
