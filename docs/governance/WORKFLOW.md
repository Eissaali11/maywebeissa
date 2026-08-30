# ENGINEERING WORKFLOW & GOVERNANCE

This document specifies the mandatory software development lifecycle and governance workflow for the Portfolio Platform.

---

## 1. Branch Strategy (`Branch per change`)

- Direct pushes to `main` branch are strictly prohibited.
- Every task must be isolated in its own dedicated topic branch (e.g., `chore/ops-foundation-001`).
- Branch naming convention follows `<type>/<task-id>` (e.g., `feat/auth-module`, `fix/nav-responsive`).

---

## 2. Commit Discipline (`Single Coherent Commit`)

- Commits must adhere strictly to Conventional Commits standards (e.g., `chore(ops): establish repository foundation and governance`).
- Before completing a task, commits must be squashed into a **single coherent commit** representing the complete, verified work unit.

---

## 3. Draft Pull Request & CI Automation (`Draft PR & CI`)

- Upon pushing the task branch, a **Draft Pull Request** must be opened targeting `main`.
- Automated GitHub Actions CI runs all 5 mandatory Quality Gates:
  1. Code Linting (`npm run lint`)
  2. Static Type Check (`npm run typecheck`)
  3. Automated Tests (`npm run test`)
  4. Production Build (`npm run build`)
  5. Secret Scanning (`npm run secret-scan`)

---

## 4. Review & Approval Gate (`Independent Review & Owner Approval`)

- Every task requires review from the Technical Owner / Senior Full-Stack Architect.
- Final approval from the Project Owner is mandatory before any PR can be merged into `main`.

---

## 5. Stage Gate Transition Rule (`PROVEN Status Only`)

- Transitioning to the next project phase or starting a new task is strictly forbidden unless the current task report is verified with status `PROVEN`.
- Tasks marked with `CLAIMED`, `UNVERIFIED`, or `BLOCKED` cannot be closed or advanced.
