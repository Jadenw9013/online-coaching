# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cross-platform web + PWA coaching platform (MVP). Clients submit weekly check-ins (metrics + photos); coaches review via an inbox, leave feedback, and publish updated macro targets + meal plans versioned by week.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript + React 19
- **Auth:** Clerk v6 (coach/client roles via `publicMetadata`, JWT session claims)
- **DB:** Postgres (Neon) + Prisma v7 + `@prisma/adapter-pg` (output: `app/generated/prisma`)
- **Storage:** Supabase Storage (private bucket, server-signed URLs)
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/postcss` plugin)
- **Forms:** React Hook Form + Zod v4
- **Deploy:** Vercel

## Commands

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build (Turbopack)
npm run lint             # Run ESLint
npx prisma migrate dev   # Run DB migrations (reads .env.local via prisma.config.ts)
npx prisma generate      # Regenerate Prisma client (after schema changes)
npx prisma studio        # Visual DB browser
npx prisma db seed       # Seed coach-client relationships
```

No test runner is configured yet.

### Schema change workflow

```bash
# 1. Edit prisma/schema.prisma
# 2. Generate migration SQL from live DB diff (avoids shadow DB issues):
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
# 3. Create migration dir + SQL file manually under prisma/migrations/
# 4. Apply:
npx prisma migrate deploy
npx prisma generate
```

`prisma migrate dev` may fail due to shadow database issues with Neon. Use the diff approach above instead.

## Architecture

### Routing & Auth

- **Auth middleware:** `proxy.ts` at project root (Next.js 16 convention, replaces `middleware.ts`). Uses `clerkMiddleware()` — protects all routes except `/`, `/sign-in`, `/sign-up`, `/api/webhooks`.
- **Role gating:** Not in middleware. Each route's Server Component calls `getCurrentDbUser()` and checks `activeRole`. Coach layout redirects non-coaches to `/client`; client pages verify client role.
- **Roles:** Clerk `publicMetadata.role` synced via webhook → DB `User.activeRole`. Users can have both `isCoach` + `isClient` flags and switch via `setActiveRole()` action.
- **Path alias:** `@/*` maps to the project root.

### Data Layer

- **Prisma config:** `prisma.config.ts` loads `.env.local` via dotenv. Schema at `prisma/schema.prisma`, generated client at `app/generated/prisma/`. Import `PrismaClient` from `@/app/generated/prisma/client` and enums from `@/app/generated/prisma/enums`.
- **DB singleton:** `lib/db.ts` — PrismaClient with PrismaPg adapter. Single instance cached on `globalThis` in dev.
- **Query functions:** `lib/queries/` — server-only data fetching, called from Server Components. Each returns typed Prisma results.
- **Server Actions:** `app/actions/` — mutations with Zod validation. All actions verify auth + role + relationship ownership before mutating.
- **Authorization pattern:** Coach endpoints call `verifyCoachAccessToClient(clientId)` which checks `CoachClient` assignment table. Throws if unauthorized.

### Week-based data model

All data is scoped by `weekOf` (DateTime), canonicalized to Monday midnight UTC via `normalizeToMonday()` in `lib/utils/date.ts`. Check-ins, macros, meal plans, and messages are all keyed by `(clientId, weekOf)`.

### Key data flows

**Check-in submission:** Client form → `createSignedUploadUrls()` → browser uploads photos directly to Supabase → `createCheckIn()` server action creates CheckIn + CheckInPhoto records.

**Coach review workspace** (`/coach/clients/[clientId]/review/[weekStartDate]`): Server Component fetches check-in, macros, draft/published meal plans, messages, and food library in parallel. Renders 2-column layout — left: check-in summary + macro editor + messages; right: meal plan editor.

**Meal plan editor (V2):** `MealPlanEditorV2` owns state as `MealGroup[]` (grouped by meal name). On save, `flattenMeals()` converts back to flat items array for the existing `saveDraftMealPlan` action. Macros are coach-only (toggle hidden by default).

**Client view:** `SimpleMealPlan` shows food + portions only — no macros, no version numbers, no draft/published status.

### Component organization

- `components/coach/inbox/` — dashboard inbox (filter bar + client cards)
- `components/coach/meal-plan/` — V2 meal plan editor tree (editor → meal cards → food rows → portion editor, food search dropdown)
- `components/coach/review/` — check-in summary for review workspace
- `components/client/` — client-facing components (simple meal plan, connect coach banner)
- `components/messages/` — chat thread (used by both roles)
- `components/check-in/` — check-in form + photo upload
- `components/ui/` — shared nav bar, role switcher

### Supabase Storage

Photos uploaded via server-signed URLs (1hr TTL). Service-role key stays server-side only (`lib/supabase/server.ts`). Download URLs generated server-side on demand with 1hr TTL. Image domains configured in `next.config.ts` for Next.js Image optimization.

### Webhook

`/api/webhooks/clerk` syncs Clerk users to the DB using `verifyWebhook` from `@clerk/nextjs/webhooks` (requires `NextRequest`). Must remain a public route.

## Security Rules

- NEVER hardcode secrets. Use environment variables only.
- Do not print or log secret env vars.
- Supabase service role key: server-side only (Server Components, Route Handlers, Server Actions).
- All coach endpoints verify the CoachClient assignment before exposing client data.
- Photo uploads use signed URLs — the service key never reaches the browser.
