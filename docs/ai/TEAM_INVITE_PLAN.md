# Steadfast — Team Invite Feature Plan

> **For Antigravity / Claude:** Read this file fully, then read `CONTEXT.md` and `TEAM_FEATURE_PLAN.md` before writing any code. This plan extends the completed Team Profile feature with a self-service invite link flow. All constraints from `TEAM_FEATURE_PLAN.md` remain in effect.

---

## Context & Gap Being Filled

The Team Profile feature (already shipped) only allows a `HEAD_COACH` to add coaches to their team by raw userId. There is no way for a coach to join a team themselves.

This plan adds an invite link flow: a `HEAD_COACH` generates a shareable link, any coach with the link can use it to join the team as a `COACH`. This is modeled directly on the existing `ClientInvite` pattern already in the codebase (`model ClientInvite`, `app/invite/[token]/`, `app/actions/client-invites.ts`) — follow those files as the reference implementation.

---

## What Changes

| Area | Change |
|---|---|
| `prisma/schema.prisma` | Add `TeamInvite` model |
| `app/actions/teams.ts` | Add `generateTeamInvite` and `acceptTeamInvite` actions |
| `lib/queries/teams.ts` | Add `getTeamInviteByToken` query |
| `components/coach/TeamSection.tsx` | Add "Invite a coach" UI (generate link + copy button) |
| `app/invite/team/[token]/page.tsx` | New page — coach lands here to accept invite |

---

## Critical Constraints (same as TEAM_FEATURE_PLAN.md)

1. Import Prisma client from `@/app/generated/prisma/client` only
2. Explicit `select` on all queries — no bare `include` on `User` or `CoachClient`
3. `getCurrentDbUser()` at the top of every protected page
4. Dark mode only — no light mode conditionals
5. Tailwind CSS v4 syntax
6. Server Actions only for mutations
7. `revalidatePath` after every DB write
8. No new context providers

---

## Implementation Order

Execute in strict sequence. Confirm each step compiles before proceeding.

1. Schema migration — add `TeamInvite` model
2. Add `getTeamInviteByToken` to `lib/queries/teams.ts`
3. Add `generateTeamInvite` and `acceptTeamInvite` to `app/actions/teams.ts`
4. Update `components/coach/TeamSection.tsx` — add invite link UI to State B
5. Create `app/invite/team/[token]/page.tsx`
6. `npm run build` + `npm run lint` — zero new errors

---

## Step 1 — Schema Migration

Add to `prisma/schema.prisma` directly below the `Team` model:

```prisma
model TeamInvite {
  id          String       @id @default(cuid())
  teamId      String
  inviteToken String       @unique @default(cuid())
  status      InviteStatus @default(PENDING)
  createdAt   DateTime     @default(now())
  expiresAt   DateTime

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([teamId])
  @@index([inviteToken])
}
```

Also add the relation back on the `Team` model:

```prisma
model Team {
  // ... existing fields
  members     User[]
  invites     TeamInvite[]   // add this line
}
```

`InviteStatus` enum already exists in the schema (`PENDING | ACCEPTED | EXPIRED`) — do not add a new enum.

After editing:

```bash
npx prisma migrate dev --name add-team-invite
npx prisma generate
# restart dev server
```

---

## Step 2 — Query

Add to `lib/queries/teams.ts`:

```typescript
import type { InviteStatus } from "@/app/generated/prisma/client";

export async function getTeamInviteByToken(token: string) {
  return db.teamInvite.findUnique({
    where: { inviteToken: token },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      teamId: true,
      team: {
        select: { id: true, name: true, slug: true, logoPath: true },
      },
    },
  });
}
```

---

## Step 3 — Server Actions

Add to `app/actions/teams.ts`:

```typescript
// HEAD_COACH only: generate a shareable team invite link (7-day expiry)
export async function generateTeamInvite(teamId: string) {
  const user = await getCurrentDbUser();
  if (user.teamRole !== "HEAD_COACH" || user.teamId !== teamId) {
    throw new Error("Only the head coach can generate team invites.");
  }

  // Expire any existing pending invites for this team first
  await db.teamInvite.updateMany({
    where: { teamId, status: "PENDING" },
    data: { status: "EXPIRED" },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await db.teamInvite.create({
    data: {
      teamId,
      expiresAt,
    },
    select: { inviteToken: true },
  });

  revalidatePath("/coach/settings");
  return { success: true, token: invite.inviteToken };
}

// Any authenticated coach can call this to join via a valid token
export async function acceptTeamInvite(token: string) {
  const user = await getCurrentDbUser();
  if (!user.isCoach) throw new Error("Only coaches can join a team.");
  if (user.teamId) throw new Error("You are already on a team. Leave your current team first.");

  const invite = await db.teamInvite.findUnique({
    where: { inviteToken: token },
    select: { id: true, teamId: true, status: true, expiresAt: true },
  });

  if (!invite) throw new Error("Invite not found.");
  if (invite.status !== "PENDING") throw new Error("This invite has already been used or expired.");
  if (invite.expiresAt < new Date()) {
    await db.teamInvite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    throw new Error("This invite link has expired. Ask your head coach to generate a new one.");
  }

  // Join the team as COACH — do NOT mark invite as ACCEPTED so others can still use the same link
  await db.user.update({
    where: { id: user.id },
    data: { teamId: invite.teamId, teamRole: "COACH" },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true, teamId: invite.teamId };
}
```

**Important design note:** The invite token is reusable for its 7-day window — do not mark it `ACCEPTED` after one use, since the HEAD_COACH may want to share the same link with multiple coaches. A new `generateTeamInvite` call expires the previous token and issues a fresh one. This matches how team invite links work in tools like Slack and Notion.

---

## Step 4 — Update `TeamSection.tsx`

In State B (coach is on a team), add an "Invite a coach" subsection visible only when `teamRole === "HEAD_COACH"`.

UI requirements:
- A "Generate invite link" button that calls `generateTeamInvite(teamId)` via a server action
- On success, display the full invite URL: `${process.env.NEXT_PUBLIC_APP_URL}/invite/team/[token]`
- A "Copy link" button that copies the URL to clipboard
- A note beneath: "This link expires in 7 days. Generating a new link will invalidate the previous one."
- If a valid (non-expired) invite already exists for this team, fetch and display it on load so the HEAD_COACH doesn't have to regenerate unnecessarily. To support this, add a `currentInviteToken?: string | null` prop to `TeamSection` — see Step 5 for how to populate it.

To populate `currentInviteToken`, add a query to `lib/queries/teams.ts`:

```typescript
export async function getActiveTeamInvite(teamId: string) {
  return db.teamInvite.findFirst({
    where: {
      teamId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    select: { inviteToken: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });
}
```

Then in `app/coach/settings/page.tsx`, fetch it alongside the existing team data:

```typescript
const activeInvite = user.teamId ? await getActiveTeamInvite(user.teamId) : null;

// Pass to TeamSection:
<TeamSection user={user} teamData={teamData} activeInvite={activeInvite} />
```

---

## Step 5 — Accept Invite Page

Create `app/invite/team/[token]/page.tsx`.

This page is accessible to unauthenticated users (for link preview) but the accept action requires auth. Model it closely on the existing `app/invite/[token]/page.tsx`.

**Page behavior:**
1. Fetch the invite via `getTeamInviteByToken(token)` (server-side)
2. If invite not found → render an error state: "This invite link is invalid."
3. If invite status is `EXPIRED` or `expiresAt` is in the past → render: "This invite link has expired. Ask your head coach to generate a new one."
4. If invite is valid → render the team name, team logo (if present via `TeamBadge`), and a "Join [Team Name]" button
5. If the visiting user is not authenticated → show the team info and a "Sign in to join" button that redirects to Clerk sign-in with a `redirect_url` back to this page
6. If the visiting user is authenticated but already on a team → show: "You're already on a team. Leave your current team in settings before joining a new one."
7. If the visiting user is authenticated, is a coach, and has no team → show the "Join [Team Name]" button which calls `acceptTeamInvite(token)` and on success redirects to `/coach/settings`
8. If the visiting user is authenticated but is not a coach (`isCoach === false`) → show: "Only coaches can join a team."

**Page structure:**

```tsx
import { getTeamInviteByToken } from "@/lib/queries/teams";
import { getCurrentDbUser } from "@/lib/auth/getCurrentDbUser";
import { acceptTeamInvite } from "@/app/actions/teams";
import TeamBadge from "@/components/ui/TeamBadge";
import { redirect } from "next/navigation";

export default async function TeamInvitePage({
  params,
}: {
  params: { token: string };
}) {
  const invite = await getTeamInviteByToken(params.token);

  // Invalid token
  if (!invite) {
    return <InviteErrorState message="This invite link is invalid." />;
  }

  // Expired
  if (invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return (
      <InviteErrorState message="This invite link has expired. Ask your head coach to generate a new one." />
    );
  }

  // Try to get the current user — null if not authenticated
  let user = null;
  try {
    user = await getCurrentDbUser();
  } catch {
    // Not authenticated — show sign-in prompt
  }

  return (
    <div>
      <TeamBadge
        teamName={invite.team.name}
        logoPath={invite.team.logoPath}
        size="md"
      />
      {/* Render appropriate CTA based on user state — see behavior rules above */}
    </div>
  );
}
```

Style this page consistently with the existing `/invite/[token]/` page — same layout, same dark aesthetic, same button styles.

---

## Step 6 — Build & Lint

```bash
npm run build
npm run lint
```

Both must exit 0 with zero new errors or warnings before this feature is considered done.

---

## What Not to Build in This Pass

- No email notification to HEAD_COACH when a coach joins via invite — add in a future notifications pass
- No invite analytics or tracking (how many coaches used the link)
- No per-coach invite tokens — one shared link per team is sufficient
- No role selection on the invite page — all coaches who join via invite are assigned `COACH` role; HEAD_COACH can manually promote via the existing `addCoachToTeam` action if needed

---

## Definition of Done

- [ ] `npm run build` passes with zero new errors
- [ ] `npm run lint` passes
- [ ] `TeamInvite` model exists in schema and migration is applied
- [ ] A `HEAD_COACH` sees an "Invite a coach" section in `/coach/settings` with a "Generate invite link" button
- [ ] Generating a link displays the full URL and a copy button
- [ ] If an active invite already exists on page load, it is shown without requiring regeneration
- [ ] Generating a new link expires the previous one
- [ ] A coach visiting `/invite/team/[token]` with a valid link sees the team name and a "Join" button
- [ ] Clicking "Join" adds the coach to the team as `COACH` and redirects to `/coach/settings`
- [ ] The newly joined coach sees their team badge in settings immediately after joining
- [ ] A coach who is already on a team sees an appropriate error — not a broken state
- [ ] An unauthenticated visitor sees the team info and a "Sign in to join" prompt
- [ ] An expired or invalid token renders a clean error message — not a 500 or blank page
- [ ] All new queries use explicit `select`

---

## Suggested Antigravity Prompt

Once the initial `TEAM_FEATURE_PLAN.md` implementation is fully complete and verified, drop this file into the project root and use this prompt:

```
The Team Profile feature from TEAM_FEATURE_PLAN.md is fully complete. Now read TEAM_INVITE_PLAN.md fully, then read CONTEXT.md and TEAM_FEATURE_PLAN.md for reference.

Implement the Team Invite feature exactly as specified in TEAM_INVITE_PLAN.md, following the 6-step implementation order. Confirm each step compiles before proceeding. Do not deviate from the constraints at the top of the plan.
```
