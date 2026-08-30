# Portfolio Platform — Modular Monolith

Personal showcase and operational hub for Senior Systems & Application Engineer. Built using Next.js App Router, TypeScript, and Tailwind CSS under strict engineering governance.

## Architectural Principles

- **Pattern**: Modular Monolith
- **Language**: TypeScript (Strict Mode)
- **Framework**: Next.js App Router
- **Styling**: Tailwind CSS
- **Governance**: Automated Quality Gates, Conventional Commits, Single Coherent Commit per task.

## Repository Structure

```text
src/
├── app/          # Next.js App Router pages, layouts, and API routes
├── modules/      # Core business domains (posts, projects, contact, auth, media, audit)
├── components/   # UI components (ui, sections, three)
├── lib/          # Utilities, db, auth, validation, security
├── tests/        # Automated test suites
└── types/        # TypeScript type definitions
```

## Governance Documentation

- [Project Charter](docs/project/PROJECT-CHARTER.md)
- [Quality Gates](docs/governance/QUALITY-GATES.md)
- [Engineering Workflow](docs/governance/WORKFLOW.md)

## Development Quality Commands

```bash
# Run ESLint check
npm run lint

# Run TypeScript typecheck
npm run typecheck

# Run test suite
npm run test

# Run production build
npm run build

# Run secret scanning
npm run secret-scan
```
