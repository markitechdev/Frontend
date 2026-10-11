# Project Management: Frontend Development Priorities

**Author:** jhnyz (Project Manager)  
**Target Repository:** Frontend (`markitechdev/Frontend`)  
**Date:** 2026-10-11  

---

## 1. Prioritization Framework

Frontend tasks are categorized into three active tiers based on user security impact, data integrity, and operational usability:

### P1 — HIGH (Security, Access & Action Integrity)
- **Scope:** Login UI security, removing hardcoded demo passwords from production bundles, cryptographic re-verification of localStorage permissions, action button submission locking to stop duplicate transactions, and mobile navigation drawer.
- **Justification:** Hardcoded credentials and editable localStorage create immediate security bypass vectors. Action buttons without double-click protection cause duplicate transactions and corrupted stock records.

### P2 — MEDIUM (Performance, Skeletons & Visualization)
- **Scope:** Client-side SWR/Pinia navigation caching, input debouncing, skeleton loaders (eliminating CLS), horizontal graph tooltips and scaling, fixing browser Back trapping on `/forbidden`.
- **Justification:** Essential for daily operational responsiveness and visual feedback. Prevents layout displacement and improves user confidence during analytical inspection.

### P3 — IMPROVEMENT (UI Standardization & Polish)
- **Scope:** Standardizing deletion confirmations to `ModalDialog.vue`, sticky table column pinning on mobile, microcopy, and spacing polish.
- **Justification:** Refines the interface into a cohesive, professional enterprise experience once core security and stability gates are certified.
