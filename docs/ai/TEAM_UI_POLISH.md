# Steadfast — Team UI/UX Polish Pass

> **For Antigravity / Claude:** Read this file fully, then read `CONTEXT.md`, `TEAM_FEATURE_PLAN.md`, and `TEAM_INVITE_PLAN.md` for full context. This is a UI/UX polish pass — no new DB models or migrations required. All changes are component and layout improvements plus missing logical flows.

---

## What This Pass Fixes

The team feature is functionally complete but has four categories of problems:

1. **Invisible feedback loop** — a coach creates a team but sees no reflection of it on their profile page, no confirmation it worked, no preview of how it looks publicly
2. **Orphaned Team section in settings** — visually disconnected from the rest of the page, no context about what creating a team actually does
3. **Missing actions** — no way to edit team name/description after creation, no way to dissolve a team, no way to transfer HEAD_COACH status
4. **No post-join confirmation** — coaches who accept a team invite land on settings with no clear visual callout that they've successfully joined

---

## Critical Constraints (unchanged from previous plans)

1. Import Prisma client from `@/app/generated/prisma/client` only
2. Explicit `select` on all new queries — no bare `include` on `User` or `CoachClient`
3. `getCurrentDbUser()` at the top of every protected page
4. Dark mode only — `ThemeProvider` always returns `"dark"`, no light mode conditionals
5. Tailwind CSS v4 syntax (`@import "tailwindcss"`)
6. Server Actions only for mutations — no new API routes
7. `revalidatePath` after every DB write
8. No new context providers — all data server-rendered and passed as props
9. Fonts: Sora (body), Chakra Petch (headings), Geist Mono (code)
10. No hardcoded `text-[10px]` or `text-[11px]` — minimum `text-xs` on mobile

---

## Implementation Order

Execute in strict sequence. Confirm each step compiles before proceeding.

1. Add missing server actions (`dissolveTeam`, `transferHeadCoach`, `updateTeam` edit flow)
2. Rework `TeamSection.tsx` — State A (no team) and State B (on a team) visual overhaul
3. Add team badge to coach profile page (`app/coach/marketplace/profile/` or equivalent)
4. Add `?joined=true` redirect param handling to `/coach/settings` for post-invite confirmation
5. Polish `/invite/team/[token]/page.tsx` — visual upgrade and clearer state handling
6. `npm run build` + `npm run lint` — zero new errors

---

## Step 1 — Missing Server Actions

Add to `app/actions/teams.ts`:

### `dissolveTeam` — HEAD_COACH only

Removes all members from the team (sets their `teamId` and `teamRole` to null) then deletes the team record. This is destructive and irreversible — the UI must show a confirmation dialog before calling it.

```typescript
export async function dissolveTeam(teamId: string) {
  const user = await getCurrentDbUser();
  if (user.teamRole !== "HEAD_COACH" || user.teamId !== teamId) {
    throw new Error("Only the head coach can dissolve the team.");
  }

  // Remove all members first
  await db.user.updateMany({
    where: { teamId },
    data: { teamId: null, teamRole: null },
  });

  // Delete the team (cascades to TeamInvite records)
  await db.team.delete({ where: { id: teamId } });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true };
}
```

### `transferHeadCoach` — HEAD_COACH only

Promotes another team member to HEAD_COACH and demotes the current HEAD_COACH to COACH.

```typescript
export async function transferHeadCoach(teamId: string, newHeadCoachId: string) {
  const user = await getCurrentDbUser();
  if (user.teamRole !== "HEAD_COACH" || user.teamId !== teamId) {
    throw new Error("Only the head coach can transfer leadership.");
  }

  await db.user.update({
    where: { id: newHeadCoachId },
    data: { teamRole: "HEAD_COACH" },
  });

  await db.user.update({
    where: { id: user.id },
    data: { teamRole: "COACH" },
  });

  revalidatePath("/coach/settings");
  revalidatePath("/coaches");
  return { success: true };
}
```

Note: `updateTeam` (name, description, logo) already exists from the original plan. Verify it is wired to an edit form in the UI — if not, wire it in Step 2.

---

## Step 2 — Rework `TeamSection.tsx`

This is the most impactful change. The current component is functional but visually plain and missing key UX moments. Rebuild it with the following design and logic requirements.

### State A — No team (Create flow)

**Current problem:** Blank form with no context. A coach doesn't know what they're creating or why.

**Required improvements:**
- Add a brief benefit statement above the form — 2 lines max. Example: "Create a team to group coaches under a shared brand on your public profile. Clients will see your team affiliation on your coaching card."
- Add a visual preview hint — a small mock showing what a team badge looks like on a coach card (can be a static illustration or a live `<TeamBadge>` with placeholder data)
- After successful team creation, do not just re-render State B silently. Show a brief inline success moment: "Team created! Your team badge is now visible on your public profile." with a link to preview it

### State B — On a team (Manage flow)

Redesign this into clearly separated subsections. Use visual dividers or card grouping to separate concerns:

#### Subsection 1 — Team identity
- `<TeamBadge size="md" showRole={true} />` prominently at the top
- If `HEAD_COACH`: show inline edit fields for team name and description (not a separate modal — inline edit with a pencil icon that toggles to an input, saves on blur or explicit save button). Wire to existing `updateTeam` action.
- Team logo upload button — wires to existing `/api/team-logo` endpoint

#### Subsection 2 — Members list (HEAD_COACH only)
- List each member with their avatar (`profilePhotoPath` via Supabase signed URL), full name, and role pill
- Per-member actions: "Remove" button (calls `removeFromTeam`) and "Make Head Coach" button (calls `transferHeadCoach`) — both with confirmation prompts
- Empty state if only 1 member (the HEAD_COACH themselves): "No other coaches yet — invite one below"

#### Subsection 3 — Invite link (HEAD_COACH only)
- This already exists but needs better visual treatment
- Show the invite URL in a styled readonly input with a "Copy" button and a "Regenerate" button side by side
- Show expiry date: "Expires [date]" in muted text beneath
- If no active invite: show "Generate invite link" as the primary CTA

#### Subsection 4 — Danger zone (HEAD_COACH only)
- Visually separated section at the bottom with a red-tinted border or background
- Two actions:
  - "Transfer leadership" — opens an inline selector of current team members, confirms, calls `transferHeadCoach`
  - "Dissolve team" — requires typing the team name to confirm (same pattern as GitHub repo deletion), then calls `dissolveTeam`

#### For COACH role (not HEAD_COACH):
- Show `<TeamBadge size="md" showRole={true} />` at the top
- Show the member list (read-only, no action buttons)
- Show a single "Leave team" button at the bottom with a confirmation prompt

---

## Step 3 — Team Badge on Coach Profile Page

**Current problem:** A coach creates a team but their own profile management page (`/coach/marketplace/profile/` or wherever `CoachPublicProfile` editor lives) shows no team affiliation.

Find the coach-facing profile editor page. Add a read-only team display section that:
- Shows `<TeamBadge size="md" showRole={true} />` if the coach is on a team
- Shows a muted note "Manage your team in Settings →" with a link to `/coach/settings`
- If the coach has no team: shows a muted note "Not part of a team yet. Create one in Settings →"

This section is display-only — no editing here. All team management stays in settings.

---

## Step 4 — Post-Join Confirmation (`?joined=true`)

**Current problem:** A coach accepts a team invite and lands on `/coach/settings` with no acknowledgment that anything happened. They have to scroll down to find the Team section to verify it worked.

**Fix in `acceptTeamInvite` action (`app/actions/teams.ts`):**

Change the redirect to include a query param:
```typescript
// At the end of acceptTeamInvite, instead of returning { success, teamId }
// the page.tsx should redirect with:
redirect("/coach/settings?joined=true");
```

If the action is called from a client component, return `{ success: true }` and handle the redirect in the component. If the accept page uses a form action, use `redirect()` directly in the action.

**Fix in `app/coach/settings/page.tsx`:**

Read the `?joined=true` param server-side:
```typescript
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { joined?: string };
}) {
  const justJoined = searchParams.joined === "true";
  // ...
}
```

Pass `justJoined` as a prop to `TeamSection`. When `justJoined` is true, render a prominent success banner at the top of the Team section:

```
✓ You've joined [Team Name]! Your team badge is now visible on your public profile.
```

Auto-dismiss after 5 seconds or on manual close. Use a `useEffect` with `setTimeout` in a client component wrapper — or simply render it conditionally without auto-dismiss for simplicity.

---

## Step 5 — Polish `/invite/team/[token]/page.tsx`

**Current problem:** The accept page is functional but likely plain. It's the first impression a coach gets of the team feature.

**Required improvements:**

### Visual design
- Center the content vertically and horizontally on the page — this is a standalone landing page, not a settings sub-page
- Show the team logo prominently at the top (large, not small badge size)
- Team name in Chakra Petch heading font, large
- Team description beneath (if present)
- Clear primary CTA: "Join [Team Name]" as a full-width or wide button
- Muted secondary text: "You'll join as a Coach. Your head coach can update your role."

### State clarity
Each of the 8 error/edge states should have a distinct, readable layout — not just plain text. Minimum: an icon or visual indicator, a clear headline, and a helpful action (e.g. "Go to Settings" link, "Sign in" button).

| State | Headline | Action |
|---|---|---|
| Invalid token | "This invite link is invalid" | Link to `/coaches` marketplace |
| Expired | "This invite has expired" | "Contact your head coach" (no link — they need to ask for a new one) |
| Already on a team | "You're already on a team" | Link to `/coach/settings` |
| Not a coach | "This invite is for coaches only" | No action |
| Not authenticated | "Sign in to join [Team Name]" | Clerk sign-in button with redirect back |
| Valid + ready | "[Team Name] is inviting you" | "Join [Team Name]" button |

### After joining
Do not just redirect silently. Before redirecting to `/coach/settings?joined=true`, show a brief success flash: "Welcome to [Team Name]!" for 1–2 seconds, then redirect. This can be a simple client-side state in the accept page component.

---

## Step 6 — Build & Lint

```bash
npm run build
npm run lint
```

Both must exit 0 with zero new errors before this pass is done.

---

## What Not to Build in This Pass

- No team public page at `/teams/[slug]`
- No team-level analytics
- No email notifications for team events
- No team logo upload UI improvements (the endpoint already exists — the basic upload button is sufficient for now)
- No search/autocomplete for finding coaches to add — still using raw userId input for `addCoachToTeam`

---

## Definition of Done

- [ ] `npm run build` and `npm run lint` both exit 0
- [ ] State A of `TeamSection` includes benefit context and a post-creation success message
- [ ] State B is visually organized into distinct subsections (identity / members / invite / danger zone)
- [ ] Inline team name/description editing works and calls `updateTeam`
- [ ] `dissolveTeam` exists, requires typed confirmation, and removes all members before deleting
- [ ] `transferHeadCoach` exists with confirmation and correctly swaps roles
- [ ] Coach profile editor page shows team badge (read-only) with a link to settings
- [ ] Accepting a team invite redirects to `/coach/settings?joined=true`
- [ ] `?joined=true` triggers a visible success banner in the Team section
- [ ] `/invite/team/[token]/page.tsx` is visually polished and all 6 states have distinct readable layouts
- [ ] Post-join success flash shows before redirect on the invite page
- [ ] COACH role members see a read-only member list and a "Leave team" button — no management controls

---

## Suggested Antigravity Prompt

```
Read TEAM_UI_POLISH.md fully. Then read CONTEXT.md, TEAM_FEATURE_PLAN.md, and TEAM_INVITE_PLAN.md for full context on what has already been built.

Before writing any code:
- Confirm you have read all four files
- State the 6-step implementation order
- Identify every existing file you will modify and locate it in the codebase
- Locate the current TeamSection.tsx and read it in full before touching it

Then begin with Step 1 only: add dissolveTeam and transferHeadCoach to app/actions/teams.ts. Show the additions, confirm the build passes, then stop and wait for go-ahead to proceed to Step 2.
```
