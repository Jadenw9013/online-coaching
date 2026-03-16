import { db } from "@/lib/db";
import type { CoachTeamData, TeamWithMembers } from "@/types/team";

/** Used on marketplace coach cards and public profile page. */
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

/** Used on the client dashboard and profile — gets the client's coach's team info. */
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

/** Used by HEAD_COACH on the settings page. */
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

// ── Step 2: Team Invite Queries ───────────────────────────────────────────────

/** Used on the accept-invite page to validate a token server-side. */
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

/** Returns the active (non-expired PENDING) invite for a team, if any. */
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
