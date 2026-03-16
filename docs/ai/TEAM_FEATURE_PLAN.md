# Steadfast — Team Profile Feature Implementation Plan

> **For Antigravity / Claude:** Read this file fully before writing any code. Every decision here is deliberate and derived from `CONTEXT.md`. Follow the implementation order strictly — each step must compile cleanly before proceeding to the next.

---

## Feature Overview

Coaches who belong to a team should be labeled as such (with their role: "Head Coach" or "Coach") on:
- Their public marketplace card (`/coaches`)
- Their public profile page (`/coaches/[slug]`)
- Their coach settings page (`/coach/settings`)

Clients whose coach belongs to a team should see a team badge on:
- Their dashboard (`/client/dashboard`)
- Their profile page (`/client/profile`)

Coaches (`HEAD_COACH` role only) can create a team, add/remove other coaches, and update team details from `/coach/settings`.

---

## Critical Constraints — Do Not Violate These

1. **Prisma client import**: Always import from `@/app/generated/prisma/client`, never from `@prisma/client`.
2. **Explicit select on CoachClient and User**: Never use bare `include` on CoachClient or User queries that touch `checkInDaysOfWeek`, `cadenceConfig`, or `checkInDaysOfWeekOverride` — causes P2022 in Turbopack. Every new query in this feature must use explicit `select`.
3. **Auth pattern**: Every protected page/layout calls `const user = await getCurrentDbUser()` at the top. No exceptions.
4. **Dark mode only**: `ThemeProvider` always returns `"dark"`. Do not add light mode conditionals.
5. **Tailwind CSS v4**: Use `@import "tailwindcss"` syntax. Do not use v3 `@tailwind` directives.
6. **Server Actions only for mutations**: All data mutations go through Server Actions in `app/actions/`. No API routes for this feature.
7. **`revalidatePath` after every mutation**: Call it in every server action after a DB write.
8. **Mobile labels minimum `text-xs`**: No hardcoded `text-[10px]` or `text-[11px]` px classes.
9. **No global state**: No new context providers. All data is server-rendered and passed as props.
10. **`teamRole` as `String?`, not a Prisma enum**: The codebase already has TypeScript errors. Adding a new enum risks P2022 regressions in Turbopack. Use a plain `String?` field and validate at the Zod layer in actions.

---

## Implementation Order

Execute in strict sequence. Do not skip ahead or parallelize.

1. Schema migration + `prisma generate`
2. `types/team.ts`
3. `lib/queries/teams.ts`
4. `app/actions/teams.ts`
5. `components/ui/TeamBadge.tsx`
6. `components/client/ClientTeamBanner.tsx`
7. Update `CoachCard` to accept and display `teamData`
8. Update marketplace query to include team fields
9. Update public coach profile to show team section
10. `components/coach/TeamSection.tsx`
11. Wire `TeamSection` into `app/coach/settings/page.tsx`
12. Wire `ClientTeamBanner` into `app/client/dashboard/page.tsx` and `app/client/profile/page.tsx`
13. `app/api/team-logo/route.ts`
14. Run `npm run build` and `npm run lint` — fix all errors before considering done

---

## Step 1 — Schema Migration

Add to `prisma/schema.prisma`:

```prisma
model Team {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  logoPath    String?
  description String?
  createdAt   DateTime @default(now())
  members     User[]
}
```

Add these fields to the existing `User` model:

```prisma
teamId      String?   @map("team_id")
teamRole    String?   @map("team_role")
team        Team?     @relation(fields: [teamId], references: [id])
```

After editing the schema run:

```bash
npx prisma migrate dev --name add-team-model
npx prisma generate
# restart dev server
```

Do NOT run `db push`. Always use `migrate dev` to produce a migration file for the production DB.

---

## Step 2 — Type Definition

Create `types/team.ts`:

```typescript
export type TeamInfo = {
  id: string;
  name: string;
  slug: string;
  logoPath: string | null;
};

export type CoachTeamData = {
  teamId: string | null;
  teamRole: string | null; // "HEAD_COACH" | "COACH" | null
  team: TeamInfo | null;
};

export type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotoPath: string | null;
  teamRole: string | null;
};

export type TeamWithMembers = TeamInfo & {
  description: string | null;
  members: TeamMember[];
};
```

---

## Step 3 — Queries

Create `lib/queries/teams.ts`. Every query uses explicit `select` — no bare `include`.

```typescript
import { db } from "@/lib/db";
import type { CoachTeamData, TeamWithMembers } from "@/types/team";

// Used on marketplace coach cards and public profile
export async function getCoachTeamInfo(coachId: string): Promise<CoachTeamData | null> {
  const user = await db.user.findUnique({
    where: { id: coachId },
    select: {
      teamId: true,
      teamRole: true,
      team: {
        select: { id: true, name: true, slug: true, logoPath: true },
      },
    },
  });
  if (!user) return null;
  return {
    teamId: user.teamId,
    teamRole: user.teamRole,
    team: user.team,
  };
}

// Used on client dashboard and profile — gets the client's coach's team info
export async function getClientCoachTeamInfo(clientId: string): Promise<CoachTeamData | null> {
  const coachClient = await db.coachClient.findFirst({
    where: { clientId },
    select: {
      coach: {
        select: {
          teamId: true,
          teamRole: true,
          team: {
            select: { id: true, name: true, slug: true, logoPath: true },
          },
        },
      },
    },
  });
  if (!coachClient?.coach) return null;
  return {
    teamId: coachClient.coach.teamId,
    teamRole: coachClient.coach.teamRole,
    team: coachClient.coach.team,
  };
}

// Used by HEAD_COACH on the settings page
export async function getTeamWithMembers(teamId: string): Promise<TeamWithMembers | null> {
  const team = await db.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      slug: true,
      logoPath: true,
      description: true,
      members: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhotoPath: true,
          teamRole: true,
        },
      },
    },
  });
  return team ?? null;
}
```

---

## Step 4 — Server Actions

Create `app/actions/teams.ts`:

```typescript
"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth/getCurrentDbUser";
import { revalidatePath } from "next/cache";

const CreateTeamSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
});

const UpdateTeamSchema = z.object({
  teamId: z.string().cuid(),
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(300).optional(),
  logoPath: z.string().optional(),
});

const MemberSchema = z.object({
  teamId: z.string().cuid(),
  coachId: z.string().cuid(),
  role: z.enum(["HEAD_COACH", "COACH"]),
});

// Any coach can create a team; they automatically become HEAD_COACH
export async function createTeam(formData: z.infer<typeof CreateTeamSchema>) {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Only coaches can create a team.");

  const data = CreateTeamSchema.parse(formData);
  const baseSlug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const team = await db.team.create({
    data: {
      name: data.name,
      slug: `${baseSlug}-${Date.now()}`,
      description: data.description,
    },
  });

  await db.user.update({
    where: { id: user.id },
    data: { teamId: team.id, teamRole: "HEAD_COACH" },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true, teamId: team.id };
}

// HEAD_COACH only: update team name, description, or logo path
export async function updateTeam(formData: z.infer<typeof UpdateTeamSchema>) {
  const user = await getCurrentDbUser();
  if (user.teamRole !== "HEAD_COACH" || user.teamId !== formData.teamId) {
    throw new Error("Only the head coach can update team details.");
  }

  const data = UpdateTeamSchema.parse(formData);
  await db.team.update({
    where: { id: data.teamId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.logoPath && { logoPath: data.logoPath }),
    },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true };
}

// HEAD_COACH only: add another coach to the team by userId
export async function addCoachToTeam(formData: z.infer<typeof MemberSchema>) {
  const user = await getCurrentDbUser();
  if (user.teamRole !== "HEAD_COACH" || user.teamId !== formData.teamId) {
    throw new Error("Only the head coach can add members.");
  }

  const data = MemberSchema.parse(formData);
  await db.user.update({
    where: { id: data.coachId },
    data: { teamId: data.teamId, teamRole: data.role },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true };
}

// HEAD_COACH removes a coach, or any coach removes themselves
export async function removeFromTeam(coachId: string) {
  const user = await getCurrentDbUser();
  const isSelf = user.id === coachId;
  const isHeadCoach = user.teamRole === "HEAD_COACH";

  if (!isSelf && !isHeadCoach) {
    throw new Error("You don't have permission to remove this coach.");
  }

  await db.user.update({
    where: { id: coachId },
    data: { teamId: null, teamRole: null },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true };
}
```

---

## Step 5 — Components

### 5a. `components/ui/TeamBadge.tsx`

Core shared display component. Pure presentational — no data fetching inside. Receives resolved data as props.

**Props:**
```typescript
type TeamBadgeProps = {
  teamName: string;
  logoPath?: string | null;
  role?: string | null;      // "HEAD_COACH" | "COACH" | null
  showRole?: boolean;        // default false — only true on coach/marketplace surfaces
  size?: "sm" | "md";        // default "md"
};
```

**Design requirements:**
- Pill/badge shape using Steadfast dark aesthetic (consistent with existing UI patterns)
- Team logo (when present) as a small rounded-square avatar using `next/image` with explicit `width` and `height` props
- Team name in Chakra Petch (heading font)
- When `showRole` is true: render a secondary pill — "Head Coach" in an accented color, "Coach" in a muted color
- When no `logoPath`: show a generic team placeholder icon
- Returns `null` if `teamName` is empty or falsy

### 5b. `components/client/ClientTeamBanner.tsx`

Server component. Calls `getClientCoachTeamInfo(clientId)`. If coach has no team, returns `null` silently with no visible output and no error. If they do, renders `<TeamBadge showRole={false} />` with a one-line subtext: `"Your coaching is provided through [Team Name]."` Do not surface the coach's internal team role to the client.

### 5c. Update `components/coaches/CoachCard.tsx`

Add an optional `teamData?: CoachTeamData` prop. When `teamData?.team` is not null, render `<TeamBadge showRole={true} size="sm" />` below the coach name. Do not change the existing card layout — the badge sits beneath the name, not beside it.

### 5d. Update the public coach profile component (`components/coaches/` or `app/coaches/[slug]/`)

Add a "Team" section in the profile body. Render `<TeamBadge showRole={true} size="md" />` plus the team description if present. Only render this section when the coach has a team.

### 5e. `components/coach/TeamSection.tsx`

Used inside `app/coach/settings/`. Two UI states:

**State A — No team:**
- Heading: "Create your team"
- Subtext: "Group coaches under a shared team identity visible on your public profile."
- Form: team name (required) + description (optional) + submit → calls `createTeam`

**State B — On a team:**
- Shows `<TeamBadge showRole={true} size="md" />` with current team
- If `teamRole === "COACH"`: shows "Leave team" button → calls `removeFromTeam(user.id)`
- If `teamRole === "HEAD_COACH"`: shows member list (from `getTeamWithMembers`) with per-member remove buttons, an "Add coach by ID" input → calls `addCoachToTeam`, and a name/description edit form → calls `updateTeam`

---

## Step 6 — Page Integrations

### `app/client/dashboard/page.tsx`
Below the page header, above check-in status, add:
```tsx
<ClientTeamBanner clientId={user.id} />
```
`ClientTeamBanner` handles its own null render — no conditional wrapper needed.

### `app/client/profile/page.tsx`
Add `<ClientTeamBanner clientId={user.id} />` in the coach info section.

### `app/coach/settings/page.tsx`
Fetch team data server-side, then render `TeamSection`:
```tsx
const teamData = user.teamId
  ? await getTeamWithMembers(user.teamId)
  : null;

// ...in JSX:
<TeamSection user={user} teamData={teamData} />
```

### Marketplace queries (`/coaches` and `/coaches/[slug]`)
Find the existing DB query that fetches coaches for the marketplace. Add to its `select` block:
```typescript
teamId: true,
teamRole: true,
team: {
  select: { id: true, name: true, slug: true, logoPath: true },
},
```
Pass the fields as a `teamData` prop to `CoachCard` and the public profile component.

---

## Step 7 — Storage (Team Logos)

Do **not** create a new Supabase bucket. Use the existing `portfolio-media` bucket with a `teams/` path prefix.

Path convention: `teams/{teamId}/logo.{ext}`

Create `app/api/team-logo/route.ts` following the exact same presigned URL pattern as the existing `app/api/portfolio-media/` route — scoped to the `teams/` prefix. Enforce server-side that only a `HEAD_COACH` can upload.

After a successful upload, call `updateTeam({ teamId, logoPath: "teams/{teamId}/logo.{ext}" })`.

For display, use the existing Supabase signed URL helper from `lib/supabase/` — same pattern used for portfolio media.

---

## What Not to Build in This Pass

- No team public page at `/teams/[slug]`
- No email/SMS notifications for team events
- No team-level analytics or reporting
- No client-facing team discovery or filtering
- No automated head coach transfer logic if the head coach leaves — handle manually for now
- No `TeamManagementPanel` as a standalone component — the management UI lives inside `TeamSection`

---

## Definition of Done

- [ ] `npm run build` passes with zero new errors introduced by this feature
- [ ] `npm run lint` passes
- [ ] A coach with no team sees "Create your team" in `/coach/settings`
- [ ] A coach who creates a team is labeled HEAD_COACH and sees their team badge in settings
- [ ] A HEAD_COACH can add another coach by userId and that coach sees their team badge
- [ ] Both coaches appear on the marketplace with the team badge on their cards and public profiles
- [ ] A client whose coach is on a team sees `ClientTeamBanner` on their dashboard and profile
- [ ] A client whose coach has no team sees nothing — no banner, no error, no empty space
- [ ] `TeamBadge` renders correctly at both `sm` and `md` sizes in dark mode
- [ ] All new queries use explicit `select` — no bare `include` on `User` or `CoachClient`
- [ ] No new Prisma enum was introduced — `teamRole` is a plain `String?`

---

## Suggested Antigravity Prompt

Once you have opened this file in Antigravity, use this prompt to kick off implementation:

```
Read TEAM_FEATURE_PLAN.md fully. Then read CONTEXT.md fully. 

Implement the Team Profile feature for Steadfast exactly as specified in TEAM_FEATURE_PLAN.md, following the implementation order in Step 0. Do not skip steps or parallelize. After each step, confirm it compiles before moving to the next. Do not deviate from the constraints listed at the top of the plan.
```
