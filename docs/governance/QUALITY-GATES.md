# QUALITY GATES CONTRACT

This document defines the mandatory Quality Gates that must pass before any code can be merged or advanced to subsequent project stages.

---

## Gate 1: Code Linting (`lint`)

- **Purpose**: Enforces code style guidelines, catches syntax errors, and prevents anti-patterns early in development.
- **Execution Command**: `npm run lint`
- **Pass/Fail Criteria**:
  - **Pass (`PROVEN`)**: 0 ESLint errors or unresolved warnings.
  - **Fail**: Any ESLint error or unhandled warning.

---

## Gate 2: Static Type Checking (`typecheck`)

- **Purpose**: Guarantees type safety across the entire TypeScript codebase using strict mode compiler checks (`tsc --noEmit`).
- **Execution Command**: `npm run typecheck`
- **Pass/Fail Criteria**:
  - **Pass (`PROVEN`)**: TypeScript compiler succeeds with 0 type errors.
  - **Fail**: Any TypeScript syntax, type mismatch, or missing type reference error.

---

## Gate 3: Automated Test Suite (`tests`)

- **Purpose**: Validates module functionality and guards against regression.
- **Execution Command**: `npm run test`
- **Pass/Fail Criteria**:
  - **Pass (`PROVEN`)**: 100% of unit/integration test suites pass successfully.
  - **Fail**: Any failing test assertion, unhandled error during runner execution, or timeout.

---

## Gate 4: Production Build Verification (`build`)

- **Purpose**: Verifies that Next.js application builds cleanly without bundle issues, page route errors, or missing exports.
- **Execution Command**: `npm run build`
- **Pass/Fail Criteria**:
  - **Pass (`PROVEN`)**: Next.js production build creates `.next` bundle successfully with exit code 0.
  - **Fail**: Any compilation error, SSR syntax violation, or build script failure.

---

## Gate 5: Secret Scanning (`secret-scan`)

- **Purpose**: Prevents hardcoded credentials, API keys, private tokens, or sensitive strings from entering source control.
- **Execution Command**: `npm run secret-scan`
- **Pass/Fail Criteria**:
  - **Pass (`PROVEN`)**: Secret scanner reports 0 detected credentials or secrets across tracked files.
  - **Fail**: Detection of high-entropy strings, plain-text credentials, or private keys.
