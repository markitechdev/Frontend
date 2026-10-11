# Project Management: Frontend Task Dependencies & Integration Prereqs

**Author:** jhnyz (Project Manager)  
**Target Repository:** Frontend (`markitechdev/Frontend`)  
**Date:** 2026-10-11  

---

## 1. Architectural Dependencies

Frontend development sequencing must observe these technical dependencies:

1. **Backend Route Authorization BEFORE Frontend Permission QA:**
   - Frontend permission hiding (`v-if="auth.can(...)"`) cannot be certified until backend endpoints independently reject unauthorized requests.
2. **Backend Token Revocation BEFORE Login Redirection Testing:**
   - Testing 401 session expiration handling requires the backend to properly invalidate tokens on logout.
3. **Backend API Error Contract BEFORE Error Retry Component Testing:**
   - Implementing in-component retry states requires consistent JSON error shapes and status codes from server APIs.
4. **Mobile Navigation Drawer BEFORE Modal Standardization:**
   - Overall layout responsiveness must be established before polishing modal overlays and table column pinning.
