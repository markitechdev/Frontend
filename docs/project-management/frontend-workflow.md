# Project Management: Frontend Development Workflow & Gate Standards

**Author:** jhnyz (Project Manager)  
**Target Repository:** Frontend (`markitechdev/Frontend`)  
**Date:** 2026-10-11  

---

## 1. Lifecycle Statuses

Frontend tasks progress strictly through these 8 formal statuses:

1. **BACKLOG:** Documented and prioritized; awaiting sprint assignment.
2. **READY:** Acceptance criteria and dependencies are 100% complete.
3. **IN PROGRESS:** Developer actively implementing changes in a feature branch.
4. **BLOCKED:** Blocked by incomplete backend API contracts or design dependencies.
5. **FOR QA:** Deployed to staging and handed over to QA Reviewer Jaymartimpas0-prog.
6. **QA FAILED:** Retesting failed or regressions observed; returned to developer.
7. **QA PASSED:** Formally certified by QA Reviewer with zero open defects.
8. **DONE:** Formally closed and accepted by Project Manager jhnyz.

---

## 2. Developer Rules
- Developers **MUST NOT** mark tasks as `QA PASSED` or `DONE`.
- Separate pull requests must be used for each task. No monolithic commits.
- Application code must never be merged to `main` without verified QA test logs.
