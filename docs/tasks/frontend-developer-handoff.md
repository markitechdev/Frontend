# Frontend Developer Task Handoff Guide

**Author:** jhnyz (Project Manager)  
**Email:** lavinajhanyz029@gmail.com  
**Repository:** https://github.com/markitechdev/Frontend  
**Date:** 2026-10-11  
**Status:** READY FOR DEV TEAM HANDOFF  

---

## 1. Overview & Handoff Objectives

This document serves as the official operational handoff from Project Management (jhnyz) and QA (Jaymartimpas0-prog) to the Frontend Engineering Team. It outlines all expectations, environment setup steps, coding standards, branch policies, and acceptance verification criteria.

---

## 2. Development Prerequisites & Environment Setup

### 2.1 Repository Setup
`ash
git clone https://github.com/markitechdev/Frontend.git
cd Frontend
npm install
`

### 2.2 Environment Configuration
Create a .env.local file based on .env.example:
`ini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_ENV=development
`
> **IMPORTANT:** Never commit .env.local or any hardcoded credentials into Git.

### 2.3 Starting Dev Server
`ash
npm run dev
`

---

## 3. Sprint 1 Priority Execution Package

Developers should begin immediately with **Phase 1: Foundation & Security Fixes**:

1. **TASK-FE-001 (Critical): Next.js Route Guards & Middleware**
   - Intercept /admin, /inventory, /audit-logs, /users routes.
   - Redirect unauthenticated or unauthorized users before rendering sensitive components.
2. **TASK-FE-002 (Critical): Global Error Boundary & Toast Alerts**
   - Implement ErrorBoundary component to catch React rendering failures.
   - Replace native browser lert() and confirm() with non-blocking toast notifications (e.g., Sonner or React Hot Toast).
3. **TASK-FE-003 (High): Loading States & Skeleton Placeholders**
   - Introduce skeleton cards for inventory metrics and dashboard graphs.
   - Disable submit buttons during active mutation requests to prevent double-submissions.
4. **TASK-FE-004 (High): Client-Side Form Validation**
   - Validate form fields (positive numbers, SKU formats, required fields) using schema validation prior to calling Supabase.

---

## 4. Branching Strategy & PR Workflow

1. **Branch Naming Standard:**
   - Feature branches: eat/TASK-FE-XXX-short-description
   - Bugfix branches: ix/TASK-FE-XXX-short-description
2. **Commit Hygiene:**
   - Keep commits granular and self-explanatory.
   - Reference task IDs in commit messages (e.g., ix(auth): implement middleware route protection [TASK-FE-001]).
3. **Pull Request Protocol:**
   - Every PR must link to its corresponding task in docs/backlog/frontend-backlog.md.
   - Provide before/after screenshots or recordings for UI modifications.
   - Ensure 
pm run lint and 
pm run build pass without warnings.
   - Obtain approval from Project Manager (jhnyz) and QA Reviewer (Jaymartimpas0-prog) before merging to main.

---

## 5. Definition of Ready (DoR) & Definition of Done (DoD)

- **Definition of Ready (DoR):**
  - Task contains detailed user story and clear acceptance criteria.
  - Dependencies (such as backend API or Supabase schema) are confirmed ready.
- **Definition of Done (DoD):**
  - Code satisfies all acceptance criteria documented in docs/tasks/frontend-acceptance-criteria.md.
  - Zero console errors or TypeScript compilation warnings.
  - Responsive across Mobile, Tablet, and Desktop breakpoints.
  - Verified and signed off by QA.
