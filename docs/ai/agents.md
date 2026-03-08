# Agent Reference — Steadfast Coach Platform

All agents live in `.claude/agents/`. They are pre-loaded with project context from CLAUDE.md and the codebase.

## @backend-dev

**Scope:** Server actions, Prisma schema, API routes, auth, validation

**Best for:**
- Writing or modifying `app/actions/*.ts`
- Adding Prisma queries in `lib/queries/`
- Schema changes (uses the Neon-safe diff workflow)
- Zod validation schemas in `lib/validations/`
- Debugging server/client boundary issues

**Key awareness:**
- Knows about `verifyCoachAccessToClient()` ownership gate
- Knows Neon shadow-DB limitation (`migrate dev` → use diff workflow)
- Knows Prisma imports: `@/app/generated/prisma/client` (not `@prisma/client`)

---

## @frontend-dev

**Scope:** React components, Tailwind, forms, UI patterns

**Best for:**
- Building or refactoring components in `components/`
- Page layout and routing (`app/coach/`, `app/client/`)
- React Hook Form + Zod form wiring
- Loading/empty/error state coverage
- Mobile-first responsive layout

**Key awareness:**
- No component library (MUI, shadcn, etc.) — pure Tailwind
- Custom animations defined in `app/globals.css`
- Server vs client component boundary rules

---

## @security-qa

**Scope:** Security review, auth audit, secret scanning, release checks

**Best for:**
- Pre-deploy security review of new features
- Verifying auth coverage on new routes/actions
- Checking for secret leaks in new code
- Post-refactor sanity check

**Key awareness:**
- Full threat model specific to this app's attack surface
- Knows exact grep commands for common vulnerability patterns
- Knows the `npm run release-check` / `release.sh` gate

---

## @product-lead

**Scope:** Feature scoping, user story clarity, backlog decisions

**Best for:**
- Breaking down vague feature requests into tasks
- Deciding what's in/out of scope for MVP
- Evaluating competing approaches from a product angle

---

## @product-designer

**Scope:** UX review, accessibility, mobile experience

**Best for:**
- Reviewing component designs before build
- Identifying missing UI states
- Ensuring "what do I do next?" clarity (core principle)

---

## @release-manager

**Scope:** Build, lint, test, deploy readiness

**Best for:**
- Running the full release gate before pushing
- Diagnosing build/lint errors
- Verifying Vercel deploy config

**Commands it runs:**
```bash
npm run build
npm run lint
npm run test
npm run release-check
```
