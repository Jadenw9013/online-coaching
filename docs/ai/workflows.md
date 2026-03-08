# Multi-Agent Workflows — Steadfast Coach Platform

Common patterns for using Ruflo swarm orchestration in this repo.

## Pattern 1: New Feature (Full Stack)

For features that span server + client (e.g. "add coach notes to check-in"):

```
1. @product-lead  — scope the feature, define acceptance criteria
2. @backend-dev   — server action + Prisma schema change + query function
3. @frontend-dev  — UI component + form wiring + loading/error states
4. @security-qa   — auth coverage + input validation review
5. @release-manager — build + lint + test gate
```

## Pattern 2: Schema Change

```
1. @backend-dev — edit prisma/schema.prisma
2. @backend-dev — run migration diff workflow (Neon-safe):
   npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
3. @backend-dev — create migration SQL file under prisma/migrations/
4. @backend-dev — apply: npx prisma migrate deploy && npx prisma generate
5. @security-qa — verify no raw DB errors exposed to client
```

## Pattern 3: Security Audit

Before any major release:

```
@security-qa — full threat checklist review covering:
  - Auth bypass scan (proxy.ts + layout role gates + action ownership checks)
  - Secret leak scan (grep for non-NEXT_PUBLIC_ env vars in client code)
  - Input validation coverage (all actions use Zod safeParse)
  - File upload security (signed URLs, service key server-side only)
  - Injection risk (no dangerouslySetInnerHTML, no raw SQL)
```

## Pattern 4: Performance / Refactor Review

```
@frontend-dev  — identify unnecessary "use client" directives
@backend-dev   — identify N+1 Prisma queries (check select vs include)
@security-qa   — confirm no auth regressions after refactor
```

## Pattern 5: Release Gate

```
@release-manager:
  npm run build        # TypeScript + server/client boundary check
  npm run lint         # ESLint (next core-web-vitals + typescript)
  npm run test         # Vitest unit + smoke tests
  npm run release-check  # Secret scan + localhost scan (release.sh)
```

## Swarm Commands

```bash
# Initialize for a complex multi-agent task
claude-flow swarm init
claude-flow swarm start --topology mesh --max-agents 4

# Share memory across agents in a session
claude-flow memory init
claude-flow memory set "current-task" "add SMS notification for check-in deadline"

# Monitor swarm activity
claude-flow swarm status
```

## Tips

- For simple single-file changes, just use Claude directly — no swarm needed.
- Use swarm when the task touches 3+ files across different layers (actions, queries, components).
- Always run `@release-manager` gate before pushing to `main`.
- The `@security-qa` agent knows this codebase's exact threat model — use it for any new auth-touching feature.
